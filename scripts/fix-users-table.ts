import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ospo_events',
  user: 'ospo_user',
  password: 'postgres_password'
});

async function fixUsersTable() {
  try {
    console.log('🔧 Checking current users table schema...');
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check if updated_at exists
    const hasUpdatedAt = result.rows.some(row => row.column_name === 'updated_at');

    if (!hasUpdatedAt) {
      console.log('\n❌ updated_at column missing. Adding it...');
      await pool.query(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
      console.log('✅ updated_at column added');
    } else {
      console.log('\n✅ updated_at column already exists');
    }

    await pool.end();
    console.log('\n🎉 Users table fixed!');
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

fixUsersTable();