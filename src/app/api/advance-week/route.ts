import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tick, createInitialStates } from "@/lib/engine/simulation";
import { computeBotOrder } from "@/lib/engine/bot";
import { generateEvents } from "@/lib/engine/events";
import { createWeekRng } from "@/lib/utils/seededRandom";
import { ROLES_ORDERED } from "@/lib/engine/constants";
import type {
  Role,
  WeeklyState,
  TickInput,
  GameEvent,
  ActiveEffect,
} from "@/lib/engine/types";

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json();
    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Fetch game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status !== "playing") {
      return NextResponse.json(
        { error: "Game is not in playing state" },
        { status: 400 }
      );
    }

    const currentWeek = game.current_week;
    const nextWeek = currentWeek + 1;

    // 2. Idempotency guard: check if next week states already exist
    const { data: existingNext } = await supabase
      .from("weekly_states")
      .select("id")
      .eq("game_id", gameId)
      .eq("week", nextWeek)
      .limit(1);

    if (existingNext && existingNext.length > 0) {
      return NextResponse.json({
        success: true,
        week: nextWeek,
        finished: nextWeek >= game.max_weeks,
        skipped: true,
      });
    }

    // 3. Fetch players
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId);

    if (!players || players.length < 4) {
      return NextResponse.json(
        { error: "Not enough players" },
        { status: 400 }
      );
    }

    // 4. Fetch current week states
    const { data: currentStatesArr } = await supabase
      .from("weekly_states")
      .select("*")
      .eq("game_id", gameId)
      .eq("week", currentWeek);

    if (!currentStatesArr || currentStatesArr.length < 4) {
      return NextResponse.json(
        { error: "Current week states incomplete" },
        { status: 400 }
      );
    }

    // 5. Handle bot orders
    const botPlayers = players.filter((p: any) => p.is_bot);
    for (const bot of botPlayers) {
      const botState = currentStatesArr.find(
        (s: any) => s.player_role === bot.role
      );
      if (!botState || botState.confirmed) continue;

      // Fetch bot history
      const { data: botHistory } = await supabase
        .from("weekly_states")
        .select("*")
        .eq("game_id", gameId)
        .eq("player_role", bot.role)
        .order("week", { ascending: true });

      const order = computeBotOrder(botState, botHistory || []);

      // Update bot state with order
      await supabase
        .from("weekly_states")
        .update({ order_placed: order, confirmed: true })
        .eq("game_id", gameId)
        .eq("player_role", bot.role)
        .eq("week", currentWeek);

      // Update in-memory state too
      botState.order_placed = order;
      botState.confirmed = true;
    }

    // 6. Verify all confirmed
    // Re-fetch to be safe after bot updates
    const { data: confirmedStates } = await supabase
      .from("weekly_states")
      .select("*")
      .eq("game_id", gameId)
      .eq("week", currentWeek);

    if (!confirmedStates || confirmedStates.length < 4) {
      return NextResponse.json(
        { error: "States incomplete" },
        { status: 400 }
      );
    }

    const allConfirmed = confirmedStates.every((s: any) => s.confirmed);
    if (!allConfirmed) {
      return NextResponse.json(
        { error: "Not all players confirmed" },
        { status: 400 }
      );
    }

    // 7. Build current states record
    const currentStates = {} as Record<Role, WeeklyState>;
    for (const s of confirmedStates) {
      currentStates[s.player_role as Role] = s;
    }

    // 8. Fetch demand for current week
    const { data: demandEntry } = await supabase
      .from("demand_schedule")
      .select("demand")
      .eq("game_id", gameId)
      .eq("week", currentWeek)
      .single();

    const consumerDemand = demandEntry?.demand ?? 4;

    // 9. Fetch all past events for multi-week effects
    const { data: allEvents } = await supabase
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .order("week", { ascending: true });

    const pastEvents: GameEvent[] = allEvents || [];

    // 10. Generate new events for this week (if enabled)
    const rng = createWeekRng(game.seed, currentWeek);
    const newEvents =
      game.events_enabled !== false
        ? generateEvents(gameId, currentWeek, rng)
        : [];

    // 11. Build active effects from all events (past + new)
    const allEventsForTick = [...pastEvents, ...newEvents];
    const activeEffects: ActiveEffect[] = []; // tick() uses events directly

    // 12. Run tick
    const tickInput: TickInput = {
      currentStates,
      consumerDemand,
      events: allEventsForTick,
      scenario: game.scenario,
      week: currentWeek,
      seed: game.seed,
      activeEffects,
    };

    const tickOutput = tick(tickInput);

    // 13. Insert new weekly states
    const newStates = ROLES_ORDERED.map((role) => {
      const state = tickOutput.nextStates[role];
      // Remove any client-side only fields
      const { id, pipeline_detail, ...rest } = state as any;
      return {
        ...rest,
        pipeline_detail: pipeline_detail
          ? JSON.stringify(pipeline_detail)
          : "[]",
      };
    });

    const { error: insertStatesError } = await supabase
      .from("weekly_states")
      .insert(newStates);

    if (insertStatesError) {
      // Could be idempotency race — check if already inserted
      if (insertStatesError.code === "23505") {
        return NextResponse.json({
          success: true,
          week: nextWeek,
          finished: nextWeek >= game.max_weeks,
          skipped: true,
        });
      }
      throw insertStatesError;
    }

    // 14. Insert new events
    if (newEvents.length > 0) {
      const { error: insertEventsError } = await supabase
        .from("game_events")
        .insert(newEvents);

      if (insertEventsError) {
        console.error("Error inserting events:", insertEventsError);
      }
    }

    // 15. Update game week and possibly finish
    const finished = nextWeek >= game.max_weeks;
    const updateData: any = {
      current_week: nextWeek,
      updated_at: new Date().toISOString(),
    };
    if (finished) {
      updateData.status = "finished";
    }

    const { error: updateError } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", gameId);

    if (updateError) {
      console.error("Error updating game:", updateError);
    }

    return NextResponse.json({
      success: true,
      week: nextWeek,
      finished,
      eventsGenerated: newEvents.length,
    });
  } catch (err: any) {
    console.error("advance-week error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
