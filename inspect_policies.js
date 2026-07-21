const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cqisdrbprijcwbybsllq:Nivek%408698930978@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to database!');

  const res = await client.query(`
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'storage';
  `);
  
  console.log(JSON.stringify(res.rows, null, 2));

  await client.end();
}

main();
