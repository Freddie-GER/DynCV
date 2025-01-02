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
    const { cv, jobDescription } = await request.json();

    if (!cv || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Detect if job description is in German
    const isGerman = /[äöüßÄÖÜ]/.test(jobDescription) || 
                    /(?:^|\s)(und|oder|für|mit|bei|das|die|der)(?:\s|$)/.test(jobDescription);

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

    const prompt = `You are a professional CV optimization assistant. Your task is to optimize this CV to match the provided job description.

CV Content:
${cvContent}

Job Description:
${jobDescription}

Your task:
1. Analyze how well each section of the CV matches the job requirements
2. Rewrite each section to better match the job requirements while maintaining truthfulness
3. Keep the language same as the original CV

Provide a JSON response with the following structure:
{
  "optimizedCV": {
    "content": {
      "name": "${cv.name}",
      "contact": "${cv.contact}",
      "summary": "OPTIMIZE: Rewrite the summary to highlight experiences and skills that match the job requirements",
      "skills": "OPTIMIZE: Reorganize and enhance the skills section to prioritize those mentioned in the job description",
      "experience": "OPTIMIZE: Rewrite each experience entry to emphasize achievements and responsibilities that match the job",
      "education": "OPTIMIZE: Highlight relevant coursework and projects that align with the job requirements",
      "languages": "OPTIMIZE: List languages with proficiency levels, keeping the original format",
      "achievements": "OPTIMIZE: Rewrite achievements to emphasize those most relevant to the job",
      "development": "OPTIMIZE: Focus on training and certifications most relevant to the position",
      "memberships": "OPTIMIZE: Highlight memberships most relevant to the industry and role"
    },
    "suggestions": [
      "PROVIDE: 3-5 specific suggestions for improving the CV further"
    ],
    "highlights": [
      "PROVIDE: 3-5 strongest matches between the CV and job requirements"
    ]
  }
}

IMPORTANT:
1. DO NOT just copy the original content - make meaningful improvements
2. Keep everything in the ORIGINAL LANGUAGE
3. Focus on matching job requirements
4. Use specific examples from the original CV
5. Quantify achievements where possible`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a CV optimization expert. You must make substantial improvements to each section, never just copying the original content. Keep the original language." 
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
    if (!response.optimizedCV?.content || !response.optimizedCV?.suggestions || !response.optimizedCV?.highlights) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Add language information to the response
    return NextResponse.json({
      ...response,
      isGerman
    });
  } catch (error) {
    console.error('Error optimizing CV:', error);
    return NextResponse.json(
      { error: 'Failed to optimize CV' },
      { status: 500 }
    );
  }
} 