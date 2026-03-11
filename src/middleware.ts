import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Assign a persistent anonymous user_id cookie if not present
  if (!request.cookies.get("user_id")) {
    const userId = crypto.randomUUID();
    response.cookies.set("user_id", userId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
