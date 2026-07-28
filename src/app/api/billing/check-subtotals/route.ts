import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { lines: true }
    });

    const report: any[] = [];
    let mismatchesFound = 0;

    for (const inv of invoices) {
      const lineSum = inv.lines.reduce((acc: number, line: any) => {
        const tot = Number(line.totalPrice) || (Number(line.quantity) * Number(line.unitPrice));
        return acc + tot;
      }, 0);

      const discount = Number(inv.discountAmount || 0);
      const expectedTotal = Math.max(0, lineSum - discount);
      const currentTotal = Number(inv.totalAmount);
      const isMismatch = Math.abs(currentTotal - expectedTotal) > 0.01;

      if (isMismatch) {
        mismatchesFound++;
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { totalAmount: expectedTotal }
        });
      }

      report.push({
        invoiceNumber: inv.invoiceNumber,
        lineCount: inv.lines.length,
        subtotalAmount: lineSum,
        discountAmount: discount,
        expectedTotal,
        currentTotal,
        isMismatchFixed: isMismatch
      });
    }

    return NextResponse.json({
      totalInvoicesChecked: invoices.length,
      mismatchesFoundAndFixed: mismatchesFound,
      invoices: report
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
