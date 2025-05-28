import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "User exists" }, { status: 400 });
  const hashed = await hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed, name } });
  return NextResponse.json({ success: true });
}
