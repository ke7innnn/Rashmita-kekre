const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cqisdrbprijcwbybsllq:Nivek%408698930978@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to database!');

  try {
    await client.query(`
      ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
    `);
    console.log('Successfully disabled RLS on storage.objects and storage.buckets!');
  } catch (err) {
    console.error('Error disabling RLS:', err.message);
  } finally {
    await client.end();
  }
}

main();
