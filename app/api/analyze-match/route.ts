// Next.js API route for analyzing CV match with job requirements
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

    const prompt = `You are a professional CV and job matching analyst. Analyze the fit between this CV and job description.

First, analyze the job description to determine:
1. Required years of experience
2. Expected seniority level
3. Key responsibilities
4. Required skills and qualifications

Then, analyze the CV to determine:
1. Actual years of experience
2. Current seniority level based on responsibilities
3. Current skill set
4. Qualifications

CV Content:
${cvContent}

Job Description:
${jobDescription}

Provide a detailed analysis in JSON format with the following structure:
{
  "jobAnalysis": {
    "requiredYearsExperience": "number or range (e.g., '3-5')",
    "expectedSeniority": {
      "level": "junior/mid/senior/lead/executive",
      "explanation": "explanation of why this level was determined"
    },
    "keyResponsibilities": ["list of key responsibilities"],
    "requiredSkills": ["list of required skills"],
    "requiredQualifications": ["list of required qualifications"]
  },
  "candidateAnalysis": {
    "yearsExperience": "number",
    "currentSeniority": {
      "level": "junior/mid/senior/lead/executive",
      "explanation": "explanation based on CV content"
    },
    "currentSkills": ["list of demonstrated skills"],
    "qualifications": ["list of qualifications"]
  },
  "overallFit": {
    "score": "number between 1-5",
    "explanation": "detailed explanation of the score, considering both matches and mismatches"
  },
  "seniorityFit": {
    "score": "number between 1-5",
    "level": "under-qualified/well-matched/over-qualified",
    "explanation": "detailed explanation of the seniority match or mismatch",
    "concerns": ["list any concerns about being under or over-qualified"]
  },
  "gapAnalysis": {
    "summary": {
      "gaps": ["list of key gaps found, being specific and factual"],
      "strengths": ["list of key matching strengths, with concrete examples from the CV"],
      "score": "number between 1-5",
      "questions": ["specific questions to clarify gaps or verify claimed experience"]
    },
    "skills": {
      "gaps": ["specific skill gaps, only listing those explicitly required in the job description"],
      "strengths": ["matching skills, only listing those explicitly mentioned in both CV and job description"],
      "score": "number between 1-5",
      "questions": ["specific questions about skills"]
    },
    "experience": {
      "gaps": ["specific experience gaps, comparing against job requirements"],
      "strengths": ["relevant experience matches, with concrete examples"],
      "score": "number between 1-5",
      "questions": ["specific questions about experience"]
    },
    "education": {
      "gaps": ["specific education/qualification gaps against requirements"],
      "strengths": ["relevant education matches"],
      "score": "number between 1-5",
      "questions": ["specific questions about education"]
    }
  },
  "suggestedFocus": ["list of sections that would benefit most from optimization"]
}

Important guidelines:
1. Be specific and factual - only list gaps and strengths that can be directly evidenced
2. For seniority fit, consider both under and over-qualification as potential mismatches
3. Questions should be specific and focused on verifying or clarifying actual gaps
4. Only list skills and experience that are explicitly mentioned in the documents
5. Avoid assumptions or inferring skills/experience not directly stated
6. Be honest but constructive in the analysis
7. Score explanations should reference specific examples from both documents`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional CV analyst specializing in job fit analysis and gap identification. Focus on concrete evidence and avoid assumptions. Being overqualified is considered a mismatch, just like being underqualified." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const analysis = JSON.parse(content);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing match:', error);
    return NextResponse.json(
      { error: 'Failed to analyze match' },
      { status: 500 }
    );
  }
} 