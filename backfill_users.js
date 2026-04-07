import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Sweetysai114@@db.lgmnasqmsbzwhjsetefo.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  // 1. Guarantee public.users exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      department TEXT,
      student_id TEXT,
      institution_id UUID,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  
  // 2. Create the sync trigger function
  const triggerFunc = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.users (id, full_name, email, role)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'student')
      ) ON CONFLICT (id) DO NOTHING;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  await client.query(triggerFunc);

  const dropTrigger = `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;
  await client.query(dropTrigger);

  const createTrigger = `
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  `;
  await client.query(createTrigger);

  // 3. Backfill existing users into public.users
  const backfill = `
    INSERT INTO public.users (id, full_name, email, role)
    SELECT
      id,
      COALESCE(raw_user_meta_data->>'full_name', 'User'),
      email,
      COALESCE(raw_user_meta_data->>'role', 'student')
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
  `;
  await client.query(backfill);
  
  console.log("SUCCESS. All existing auth rows are now perfectly synced into public.users tables.");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
