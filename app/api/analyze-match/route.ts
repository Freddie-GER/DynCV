// Next.js API route for analyzing CV match with job requirements
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { cv, jobDescription, isOptimized, analyzePositionOnly, positionIndex, analysisType = 'initial' } = await req.json();

    if (!cv || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // For position-specific analysis, create a focused prompt
    if (analyzePositionOnly && cv.experience?.length > 0) {
      const position = cv.experience[positionIndex];
      const prompt = `
You are an expert ATS (Applicant Tracking System) and recruitment consultant.

Job Description:
${jobDescription}

Candidate's Position:
Title: ${position.title}
Company: ${position.company}
Duration: ${position.startDate} - ${position.endDate}
Description:
${position.description}

Analyze ONLY this specific position's relevance to the job requirements. Do not consider any other experience or skills outside this position.

Provide a detailed analysis in the following JSON format:
{
  "positionAnalysis": {
    "score": <number 1-5>,
    "gaps": [<list of specific gaps between this position and job requirements>],
    "strengths": [<list of relevant strengths from this position that match job requirements>],
    "relevance": <detailed explanation of how this specific position relates to the job>
  }
}

Important:
- Score should be based ONLY on this position's direct relevance to the job
- Ignore any skills or experience not explicitly mentioned in this position
- Be critical and realistic in the assessment
- If the position has little to no relevance, the score should reflect that
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      try {
        const analysis = JSON.parse(content);
        
        // Validate the analysis object has the expected structure
        if (!analysis.positionAnalysis?.score) {
          throw new Error('Invalid position analysis structure received from OpenAI');
        }
        
        return NextResponse.json(analysis);
      } catch (error) {
        console.error('Error parsing OpenAI response:', error, 'Raw content:', content);
        return NextResponse.json(
          { error: 'Failed to parse position analysis response' },
          { status: 500 }
        );
      }
    }

    // For overall experience analysis
    if (analysisType === 'experience') {
      const prompt = `
You are an expert ATS (Applicant Tracking System) and recruitment consultant.

Job Description:
${jobDescription}

Complete Experience:
${JSON.stringify(cv.experience, null, 2)}

Analyze how the COMPLETE experience matches the job requirements. Consider both direct matches and transferable skills.

Provide a detailed analysis in the following JSON format:
{
  "experienceAnalysis": {
    "score": <number 1-5, where:
      5 = Multiple highly relevant positions with strong matches
      4 = At least one highly relevant position plus some transferable experience
      3 = One moderately relevant position or multiple positions with transferable skills
      2 = Only positions with limited relevance or transferable skills
      1 = No positions directly relevant to the role>,
    "explanation": <detailed explanation of how the complete experience matches the job>,
    "relevantPositions": [<list of positions that directly contribute to job fit>],
    "transferableSkills": [<skills from other positions that could be valuable>],
    "overallRelevance": <explanation of how the combined experience fits the role>
  }
}

Important guidelines:
1. Consider how ALL positions might contribute to job fit
2. Look for both direct matches and transferable skills
3. A single highly relevant position can justify a high score
4. Irrelevant positions should not reduce the score if there are relevant ones
5. Consider the progression and development across positions`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional CV analyst specializing in evaluating how complete career histories match job requirements. You understand both direct relevance and transferable skills."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      try {
        const analysis = JSON.parse(content);
        if (!analysis.experienceAnalysis?.score) {
          throw new Error('Invalid experience analysis structure received from OpenAI');
        }
        return NextResponse.json(analysis);
      } catch (error) {
        console.error('Error parsing OpenAI response:', error, 'Raw content:', content);
        return NextResponse.json(
          { error: 'Failed to parse experience analysis response' },
          { status: 500 }
        );
      }
    }

    // Regular initial analysis continues as before...
    const prompt = `
You are an expert ATS (Applicant Tracking System) and recruitment consultant.

Job Description:
${jobDescription}

CV Content:
${JSON.stringify(cv, null, 2)}

${isOptimized ? 'This is an optimized version of the CV. Focus on remaining gaps and improvements.' : 'This is the original CV. Provide a comprehensive analysis.'}

Analyze the CV against the job requirements and provide a detailed analysis in the following JSON format:
{
  "overallFit": {
    "score": <number between 1-5>,
    "explanation": <detailed explanation of the score, considering both explicit and implied skills>
  },
  "seniorityFit": {
    "score": <number between 1-5, where:
      5 = Perfect seniority match
      4 = Slight mismatch (slightly under/over qualified but manageable)
      3 = Moderate mismatch (noticeably under/over qualified)
      2 = Significant mismatch (seriously under/over qualified)
      1 = Complete mismatch (vastly under/over qualified)>,
    "level": <"under-qualified"/"well-matched"/"over-qualified">,
    "explanation": <detailed explanation of the seniority match or mismatch>,
    "concerns": [<list any concerns about being under or over-qualified>]
  },
  "gapAnalysis": {
    "summary": {
      "gaps": [<list of key gaps found, being specific and factual>],
      "strengths": [<list of key matching strengths, including both explicit and implied skills>],
      "score": <number between 1-5>,
      "questions": [<specific questions to clarify gaps or verify claimed experience>]
    },
    "skills": {
      "gaps": [<specific skill gaps, only listing those that cannot be covered by explicit or implied skills>],
      "strengths": [<matching skills, including both explicit and reasonably implied skills>],
      "score": <number between 1-5>,
      "questions": [<specific questions about skills>]
    },
    "experience": {
      "gaps": [<specific experience gaps, comparing against job requirements>],
      "strengths": [<relevant experience matches, with concrete examples>],
      "score": <number between 1-5>,
      "questions": [<specific questions about experience>]
    },
    "education": {
      "gaps": [<specific education/qualification gaps against requirements>],
      "strengths": [<relevant education matches>],
      "score": <number between 1-5>,
      "questions": [<specific questions about education>]
    }
  },
  "suggestedFocus": [<list of sections that would benefit most from optimization>]
}

Important guidelines:
1. Be specific and factual - list both explicit and reasonably implied skills
2. For seniority fit:
   - Score MUST reflect the level of mismatch (5 for perfect match, lower for any mismatch)
   - Being significantly over-qualified should result in a low score (2-3)
   - Being vastly over-qualified should result in the lowest score (1)
   - The same applies for under-qualification
3. Questions should be specific and focused on verifying or clarifying actual gaps
4. Consider both explicit skills and their logical implications
5. Make reasonable skill inferences based on technical capabilities
6. Be honest but constructive in the analysis
7. Score explanations should reference specific examples from both documents${
  isOptimized ? '\n8. IMPORTANT: Only analyze the current content without referencing previous versions' : ''
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are a professional CV analyst specializing in job fit analysis and gap identification. You understand both explicit skills and their implied capabilities. For example, if someone knows Power BI and Python, they have data analysis and business intelligence capabilities. ${
            isOptimized ? 'When analyzing optimized content, only consider the current content without referencing previous versions.' : ''
          }` 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const analysis = JSON.parse(content);
      
      // Validate the analysis object has the expected structure
      if (!analysis.overallFit?.explanation || !analysis.gapAnalysis) {
        throw new Error('Invalid analysis structure received from OpenAI');
      }
      
      return NextResponse.json(analysis);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error, 'Raw content:', content);
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing match:', error);
    return NextResponse.json(
      { error: 'Failed to analyze match' },
      { status: 500 }
    );
  }
} 