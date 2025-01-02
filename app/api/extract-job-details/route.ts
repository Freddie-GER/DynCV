import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts job titles and employer names from job descriptions. Return only a JSON object with "jobTitle" and "employer" fields.'
        },
        {
          role: 'user',
          content: `Extract the job title and employer from this job description. If you can't find the employer, use "Unknown Employer". If you can't find the job title, use "Untitled Position". Here's the job description:\n\n${jobDescription}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      jobTitle: result.jobTitle || 'Untitled Position',
      employer: result.employer || 'Unknown Employer'
    });
  } catch (error) {
    console.error('Failed to extract job details:', error);
    return NextResponse.json(
      { error: 'Failed to extract job details' },
      { status: 500 }
    );
  }
} 