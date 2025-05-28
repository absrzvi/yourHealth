import { prisma } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

import { ParserService } from "../../../lib/correlation-engine/services/parser.service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const type = formData.get("type") as string | null;

    if (!file || !userId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Save file to disk as before
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // Parse file with correlation-engine
    let testResult = null;
    try {
      const parserService = new ParserService();
      testResult = await parserService.processFile(file, type);
    } catch (parseErr: any) {
      return NextResponse.json({ success: false, error: `Parsing failed: ${parseErr.message}` }, { status: 422 });
    }

    // Store report metadata in DB as before
    await prisma.report.create({
      data: {
        userId,
        type,
        fileName: file.name,
        filePath: `/uploads/${file.name}`,
      },
    });

    // For MVP: return parsed result in response (in real app, would persist this)
    return NextResponse.json({ success: true, file: `/uploads/${file.name}`, testResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

