import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ reports: [] }, { status: 400 });
  }
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reports });
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const reportId = searchParams.get("id");
    if (!userId || !reportId) {
      return NextResponse.json({ success: false, error: "Missing userId or report id" }, { status: 400 });
    }
    // Find the report and check ownership
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report || report.userId !== userId) {
      return NextResponse.json({ success: false, error: "Report not found or unauthorized" }, { status: 404 });
    }
    // Delete the file from disk
    const filePath = path.join(process.cwd(), "public", report.filePath.replace(/^\/+/, ""));
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore file not found errors
    }
    // Delete from DB
    await prisma.report.delete({ where: { id: reportId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
