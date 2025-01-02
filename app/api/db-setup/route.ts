import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

export async function POST() {
  try {
    // Execute the SQL directly
    const { error } = await supabase.rpc('add_status_column');
    
    if (error) {
      console.error('Failed to execute SQL:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json(
      { error: 'Failed to set up database' },
      { status: 500 }
    );
  }
} 