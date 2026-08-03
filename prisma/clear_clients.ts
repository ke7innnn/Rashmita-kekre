import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString?.includes('supabase') || connectionString?.includes('pooler');
const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearClients() {
  console.log('Clearing all mock clients and related records...');

  try {
    const p = await prisma.payment.deleteMany({});
    console.log(`Deleted payments: ${p.count}`);

    const il = await prisma.invoiceLine.deleteMany({});
    console.log(`Deleted invoice lines: ${il.count}`);

    const inv = await prisma.invoice.deleteMany({});
    console.log(`Deleted invoices: ${inv.count}`);

    const pp = await prisma.patientPackage.deleteMany({});
    console.log(`Deleted patient packages: ${pp.count}`);

    const sp = await prisma.sessionPackage.deleteMany({});
    console.log(`Deleted session packages: ${sp.count}`);

    const ae = await prisma.assignedExercise.deleteMany({});
    console.log(`Deleted assigned exercises: ${ae.count}`);

    const fb = await prisma.feedback.deleteMany({});
    console.log(`Deleted feedback records: ${fb.count}`);

    const wl = await prisma.waitlist.deleteMany({});
    console.log(`Deleted waitlist records: ${wl.count}`);

    const sh = await prisma.sentHandout.deleteMany({});
    console.log(`Deleted sent handouts: ${sh.count}`);

    const att = await prisma.attachment.deleteMany({});
    console.log(`Deleted attachments: ${att.count}`);

    const appt = await prisma.appointment.deleteMany({});
    console.log(`Deleted appointments: ${appt.count}`);

    const cl = await prisma.callLog.deleteMany({});
    console.log(`Deleted call logs: ${cl.count}`);

    const count = await prisma.patient.deleteMany({});
    console.log(`\nSUCCESS: Deleted ${count.count} patient records.`);
    console.log('Database is now completely clean of mock clients and ready for fresh production data!');

  } catch (error) {
    console.error('Error clearing mock clients:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

clearClients();
