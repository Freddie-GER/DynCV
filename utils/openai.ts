import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Updated interfaces for two-stage analysis
export interface JobRequirement {
  text: string;
  type: 'explicit' | 'inferred';
  source?: string;  // For explicit requirements, reference the text
}

export interface JobAnalysis {
  title: string;
  keyRequirements: JobRequirement[];
  suggestedSkills: JobRequirement[];
  culturalFit: {
    explicit: string;
    inferred: string;
  };
  recommendedHighlights: JobRequirement[];
}

export async function analyzeJobPosting(jobDescription: string): Promise<JobAnalysis> {
  // Stage 1: Extract explicit requirements
  const explicitPrompt = `Analyze the following job posting and extract ONLY explicitly stated information.
  For each requirement or skill, you must quote or reference the exact part of the text where it appears.
  
  Job Description:
  ${jobDescription}
  
  Provide a JSON response with the following structure:
  {
    "title": "Exact job title as stated in the text (if not stated, use 'Position Not Specified')",
    "keyRequirements": [
      {
        "text": "The requirement",
        "type": "explicit",
        "source": "Quote or reference from the text"
      }
    ],
    "suggestedSkills": [
      {
        "text": "The skill",
        "type": "explicit",
        "source": "Quote or reference from the text"
      }
    ],
    "culturalFit": {
      "explicit": "Direct mentions of company culture, work environment, or values",
      "inferred": ""
    },
    "recommendedHighlights": [
      {
        "text": "Explicitly mentioned preferred qualifications or experiences",
        "type": "explicit",
        "source": "Quote or reference from the text"
      }
    ]
  }`;

  // Stage 2: Infer additional requirements
  const inferredPrompt = `Based on the following job posting and industry standards, infer additional relevant requirements and skills that are not explicitly stated but would be valuable for this role.
  Be conservative in your inferences and only include highly relevant items.
  
  Job Description:
  ${jobDescription}
  
  Provide a JSON response with the following structure:
  {
    "keyRequirements": [
      {
        "text": "The inferred requirement",
        "type": "inferred"
      }
    ],
    "suggestedSkills": [
      {
        "text": "The inferred skill",
        "type": "inferred"
      }
    ],
    "culturalFit": {
      "explicit": "",
      "inferred": "Inferred company culture and work environment"
    },
    "recommendedHighlights": [
      {
        "text": "Inferred qualification or experience to highlight",
        "type": "inferred"
      }
    ]
  }`;

  try {
    // Get explicit requirements
    const explicitCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: explicitPrompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const explicitContent = explicitCompletion.choices[0].message.content;
    if (!explicitContent) {
      throw new Error('No content received from OpenAI for explicit analysis');
    }

    // Get inferred requirements
    const inferredCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: inferredPrompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const inferredContent = inferredCompletion.choices[0].message.content;
    if (!inferredContent) {
      throw new Error('No content received from OpenAI for inferred analysis');
    }

    // Parse both responses
    const explicit = JSON.parse(explicitContent);
    const inferred = JSON.parse(inferredContent);

    // Merge the results
    const analysis: JobAnalysis = {
      title: explicit.title,
      keyRequirements: [
        ...explicit.keyRequirements,
        ...inferred.keyRequirements
      ],
      suggestedSkills: [
        ...explicit.suggestedSkills,
        ...inferred.suggestedSkills
      ],
      culturalFit: {
        explicit: explicit.culturalFit.explicit,
        inferred: inferred.culturalFit.inferred
      },
      recommendedHighlights: [
        ...explicit.recommendedHighlights,
        ...inferred.recommendedHighlights
      ]
    };

    // Validate the structure
    if (!analysis.title || !analysis.keyRequirements || !analysis.suggestedSkills || 
        !analysis.culturalFit || !analysis.recommendedHighlights) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    console.error('Error in two-stage analysis:', error);
    throw error;
  }
}

export async function optimizeCV(
  cvContent: string,
  jobAnalysis: JobAnalysis
): Promise<string> {
  const prompt = `Given this CV content:
  
  ${cvContent}
  
  And this job analysis:
  ${JSON.stringify(jobAnalysis, null, 2)}
  
  Optimize the CV content to better match the job requirements while maintaining authenticity.
  Focus on:
  1. Highlighting relevant experience and skills
  2. Using industry-specific keywords
  3. Quantifying achievements where possible
  4. Maintaining a professional tone
  
  Return only the optimized CV content in a clear, structured format.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('No content received from OpenAI');
  
  return content;
}

export async function suggestImprovements(
  cvContent: string,
  jobDescription: string
): Promise<string[]> {
  const prompt = `Compare this CV:
  
  ${cvContent}
  
  With this job description:
  
  ${jobDescription}
  
  Provide a JSON array of specific suggestions to improve the CV's match with the job requirements.
  Focus on actionable improvements that maintain authenticity.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('No content received from OpenAI');
  
  return JSON.parse(content) as string[];
}

export async function translateToGerman(content: string): Promise<string> {
  const prompt = `Translate the following CV content to German, maintaining professional terminology and natural language flow:
  
  ${content}
  
  Ensure the translation:
  1. Uses appropriate German business language
  2. Maintains industry-specific terminology
  3. Follows German CV conventions
  4. Preserves formatting and structure`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
  });

  const translatedContent = completion.choices[0].message.content;
  if (!translatedContent) throw new Error('No content received from OpenAI');
  
  return translatedContent;
}

export async function OpenAIStream(
  prompt: string,
  model: string = 'gpt-4o-mini',
  temperature: number = 0.7
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model,
      temperature,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Clean up the response by removing markdown formatting if present
    return content
      .replace(/```json\n?/, '')  // Remove opening ```json
      .replace(/```\n?$/, '')     // Remove closing ```
      .trim()                     // Remove any extra whitespace
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
} 