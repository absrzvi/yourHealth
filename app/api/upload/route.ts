import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const type = formData.get("type") as string | null;

    if (!file || !userId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    await prisma.report.create({
      data: {
        userId,
        type,
        fileName: file.name,
        filePath: `/uploads/${file.name}`,
      },
    });

    return NextResponse.json({ success: true, file: `/uploads/${file.name}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
