import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  try {
    const {
      applicationId,
      baseCV,
      jobDescription,
      optimizedCV,
      analysis
    } = await request.json();

    if (!applicationId || !baseCV || !jobDescription || !optimizedCV || !analysis) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update({
        optimized_cv: optimizedCV,
        analysis: analysis,
        status: 'completed'
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (err) {
    console.error('Failed to save application:', err);
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 }
    );
  }
} 