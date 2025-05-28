import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "not_implemented", message: "Apple Health integration is not implemented yet." });
}
