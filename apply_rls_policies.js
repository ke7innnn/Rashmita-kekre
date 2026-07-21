const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cqisdrbprijcwbybsllq:Nivek%408698930978@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to database!');

  const sql = `
    -- 1. Enable public uploads (INSERT)
    CREATE POLICY "Allow public insert to health360_documents" 
    ON storage.objects FOR INSERT TO public 
    WITH CHECK (bucket_id = 'health360_documents');

    -- 2. Enable public downloads & metadata queries (SELECT)
    CREATE POLICY "Allow public select from health360_documents" 
    ON storage.objects FOR SELECT TO public 
    USING (bucket_id = 'health360_documents');

    -- 3. Enable updates (REQUIRED since you pass upsert: true)
    CREATE POLICY "Allow public update in health360_documents" 
    ON storage.objects FOR UPDATE TO public 
    USING (bucket_id = 'health360_documents')
    WITH CHECK (bucket_id = 'health360_documents');

    -- 4. Enable deletions (DELETE)
    CREATE POLICY "Allow public delete from health360_documents" 
    ON storage.objects FOR DELETE TO public 
    USING (bucket_id = 'health360_documents');
  `;

  try {
    await client.query(sql);
    console.log('Successfully created all RLS policies for health360_documents!');
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
