"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ROLE_INFO } from "@/lib/engine/constants";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Role, WeeklyState } from "@/lib/engine/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface OrderPanelProps {
  myState: WeeklyState;
  gameId: string;
  role: Role;
  week: number;
  onConfirmed?: () => Promise<void>;
}

export default function OrderPanel({
  myState,
  gameId,
  role,
  week,
  onConfirmed,
}: OrderPanelProps) {
  const [orderAmount, setOrderAmount] = useState(myState.incoming_order || 4);
  const [confirming, setConfirming] = useState(false);
  const info = ROLE_INFO[role];
  const isConfirmed = myState.confirmed;

  async function handleConfirm() {
    if (orderAmount < 0) {
      toast.error("El pedido no puede ser negativo");
      return;
    }

    setConfirming(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("weekly_states")
        .update({ order_placed: orderAmount, confirmed: true })
        .eq("game_id", gameId)
        .eq("player_role", role)
        .eq("week", week);

      if (error) throw error;
      toast.success("Pedido confirmado");
      await onConfirmed?.();
    } catch (err: any) {
      toast.error("Error: " + (err.message || err));
      setConfirming(false);
    }
  }

  return (
    <Card
      className={`${
        isConfirmed ? "opacity-75 border-2 border-campo-300" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{info.emoji}</span>
        <h3 className="text-lg font-bold text-earth-800">
          Tu Tablero &mdash; {info.name}
        </h3>
        {isConfirmed && (
          <span className="ml-auto bg-campo-100 text-campo-700 text-xs px-2 py-1 rounded-full font-medium">
            Confirmado
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox
          label="Pedido entrante"
          value={myState.incoming_order}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatBox
          label="Inventario"
          value={myState.inventory}
          color="text-campo-600"
          bg="bg-campo-50"
        />
        <StatBox
          label="Backlog"
          value={myState.backlog}
          color="text-red-600"
          bg="bg-red-50"
        />
        <StatBox
          label="En transito"
          value={myState.pipeline_1 + myState.pipeline_2}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Additional info */}
      <div className="flex gap-4 text-sm text-earth-500 mb-4">
        <span>
          Envio recibido:{" "}
          <strong className="text-earth-700">{myState.incoming_shipment}</strong>
        </span>
        <span>
          Enviaste:{" "}
          <strong className="text-earth-700">{myState.units_shipped}</strong>
        </span>
      </div>

      {/* Costs */}
      <div className="flex gap-4 text-sm mb-6">
        <span className="text-campo-600">
          Costo inv: {formatCurrency(Number(myState.inventory_cost))}
        </span>
        <span className="text-red-500">
          Costo BL: {formatCurrency(Number(myState.backlog_cost))}
        </span>
      </div>

      {/* Order input */}
      {!isConfirmed ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Cajas a pedir
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderAmount(Math.max(0, orderAmount - 1))}
                className="w-10 h-10 rounded-lg bg-earth-100 hover:bg-earth-200 text-earth-700 font-bold text-lg transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                value={orderAmount}
                onChange={(e) =>
                  setOrderAmount(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="flex-1 h-10 border border-earth-200 rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-lemon-400"
              />
              <button
                onClick={() => setOrderAmount(orderAmount + 1)}
                className="w-10 h-10 rounded-lg bg-earth-100 hover:bg-earth-200 text-earth-700 font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <Button
            onClick={handleConfirm}
            loading={confirming}
            size="lg"
            className="sm:w-auto"
          >
            Confirmar Pedido
          </Button>
        </div>
      ) : (
        <div className="text-center py-3 bg-campo-50 rounded-lg">
          <p className="text-campo-700 font-medium">
            Pedido realizado: <strong>{myState.order_placed} cajas</strong>
          </p>
          <p className="text-xs text-earth-400 mt-1">
            Esperando a los demas jugadores...
          </p>
        </div>
      )}
    </Card>
  );
}

function StatBox({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg p-3 text-center`}>
      <p className="text-xs text-earth-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
