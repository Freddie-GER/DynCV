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
      baseCV,
      jobDescription,
      jobTitle,
      employer,
      optimizedCV,
      suggestions,
      highlights,
      status
    } = await request.json();

    if (!baseCV || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from('applications')
      .insert([
        {
          base_cv: baseCV,
          job_description: jobDescription,
          job_title: jobTitle || 'Untitled Position',
          employer: employer || 'Unknown Employer',
          optimized_cv: optimizedCV || null,
          suggestions: suggestions || null,
          highlights: highlights || null,
          status: status || 'in_progress'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Failed to save application:', error);
    return NextResponse.json(
      { error: 'Failed to save application' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 