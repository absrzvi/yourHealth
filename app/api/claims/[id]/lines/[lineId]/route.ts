import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string; lineId: string } }) {
  try {
    const data = await req.json();
    const oldLine = await prisma.claimLine.findUnique({ where: { id: params.lineId } });
    const line = await prisma.claimLine.update({
      where: { id: params.lineId },
      data,
    });
    // HIPAA-compliant event logging for claim line update
    await prisma.claimEvent.create({
      data: {
        eventType: 'line_updated',
        eventData: { from: oldLine, to: line },
        claimId: params.id,
      },
    });
    return NextResponse.json(line);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update claim line', details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; lineId: string } }) {
  try {
    const oldLine = await prisma.claimLine.findUnique({ where: { id: params.lineId } });
    await prisma.claimLine.delete({ where: { id: params.lineId } });
    // HIPAA-compliant event logging for claim line deletion
    await prisma.claimEvent.create({
      data: {
        eventType: 'line_deleted',
        eventData: { ...oldLine },
        claimId: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete claim line', details: error }, { status: 500 });
  }
} 