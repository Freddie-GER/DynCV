import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TranslatedCV {
  content: string;
  notes: string[];
}

export async function POST(request: Request) {
  try {
    const { cvContent } = await request.json();

    if (!cvContent) {
      return NextResponse.json(
        { error: 'CV content is required' },
        { status: 400 }
      );
    }

    // Create the prompt
    const prompt = `Translate the following CV content to German, maintaining professional terminology and formatting:
    
    ${cvContent}
    
    Provide a JSON response with the following structure:
    {
      "content": "Translated CV content in German",
      "notes": ["List of translation notes or special terminology considerations"]
    }`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: 'gpt-4o',
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const translatedCV = JSON.parse(content) as TranslatedCV;

    // Store in database
    const { data: cv, error } = await supabase
      .from('cvs')
      .insert({
        title: 'German Translation',
        content: translatedCV.content,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ translatedCV, cv });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 