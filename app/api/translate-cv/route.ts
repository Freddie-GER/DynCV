import { NextResponse } from 'next/server';
import { CVData } from '@/data/base-cv';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { cv } = await request.json();

    if (!cv) {
      return NextResponse.json(
        { error: 'Missing CV data' },
        { status: 400 }
      );
    }

    // Format CV content for the prompt
    const cvContent = Object.entries(cv)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n');

    const prompt = `You are a professional CV translator. Your task is to translate this CV from English to German, maintaining professional terminology and style.

CV Content:
${cvContent}

Provide a JSON response with the following structure:
{
  "translatedCV": {
    "name": "${cv.name}",
    "contact": "TRANSLATE",
    "summary": "TRANSLATE",
    "skills": "TRANSLATE",
    "experience": "TRANSLATE",
    "education": "TRANSLATE",
    "languages": "TRANSLATE",
    "achievements": "TRANSLATE",
    "development": "TRANSLATE",
    "memberships": "TRANSLATE"
  }
}

Important guidelines:
1. Maintain professional German business language
2. Keep proper nouns (company names, product names) unchanged
3. Use appropriate German CV terminology
4. Preserve the original formatting and structure
5. Ensure dates and numbers are formatted according to German conventions`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const response = JSON.parse(content);
    
    // Validate the response structure
    if (!response.translatedCV) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error translating CV:', error);
    return NextResponse.json(
      { error: 'Failed to translate CV' },
      { status: 500 }
    );
  }
} 