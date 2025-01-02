import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { cv, jobDescription } = await request.json();

    if (!cv || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Format CV content for the prompt
    const cvContent = Object.entries(cv)
      .map(([key, value]) => {
        if (key === 'experience' && Array.isArray(value)) {
          return `${key}:\n${value.map(exp => 
            `${exp.title} at ${exp.company}\n${exp.startDate} - ${exp.endDate}\n${exp.description}`
          ).join('\n\n')}`;
        }
        return `${key}: ${value}`;
      })
      .join('\n\n');

    const prompt = `You are a professional cover letter writer. Write a compelling cover letter based on this CV and job description.

CV Content:
${cvContent}

Job Description:
${jobDescription}

Guidelines:
1. Keep the same language as the CV and job description
2. Structure: 3-4 paragraphs (introduction, body, conclusion)
3. Highlight relevant experience and skills from the CV
4. Address key requirements from the job description
5. Keep professional but engaging tone
6. Be specific about contributions and achievements
7. Express genuine interest in the role and company
8. Keep under 400 words
9. Do not include contact information or date

Return a JSON response with:
{
  "coverLetter": {
    "content": "The full cover letter text",
    "highlights": [
      "3-4 key points emphasized in the letter"
    ],
    "keywordsUsed": [
      "important keywords incorporated from the job description"
    ]
  }
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an expert cover letter writer who creates compelling, personalized letters that highlight relevant experience and qualifications." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const response = JSON.parse(content);
    
    // Validate the response structure
    if (!response.coverLetter?.content || !response.coverLetter?.highlights || !response.coverLetter?.keywordsUsed) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
} 