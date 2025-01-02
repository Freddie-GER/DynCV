import { NextResponse } from 'next/server';
import { analyzeJobPosting } from '@/utils/openai';

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();
    
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    console.log('Analyzing job description:', jobDescription);
    
    const analysis = await analyzeJobPosting(jobDescription);
    console.log('Successfully parsed OpenAI response');
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing job:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
} 