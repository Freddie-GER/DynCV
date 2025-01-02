import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JobAnalysis {
  title: string;
  keyRequirements: string[];
  suggestedSkills: string[];
  culturalFit: string;
  recommendedHighlights: string[];
}

export async function analyzeJobPosting(jobDescription: string): Promise<JobAnalysis> {
  const prompt = `Analyze the following job posting and provide structured insights:
  
  ${jobDescription}
  
  Provide a JSON response with the following structure:
  {
    "title": "Extracted job title",
    "keyRequirements": ["List of key requirements"],
    "suggestedSkills": ["List of technical and soft skills needed"],
    "culturalFit": "Brief description of company culture and work environment",
    "recommendedHighlights": ["List of points a candidate should emphasize in their CV"]
  }`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o",
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('No content received from OpenAI');
  
  return JSON.parse(content) as JobAnalysis;
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
    model: "gpt-4o",
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
    model: "gpt-4o",
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
    model: "gpt-4o",
  });

  const translatedContent = completion.choices[0].message.content;
  if (!translatedContent) throw new Error('No content received from OpenAI');
  
  return translatedContent;
}

export async function analyzeCV(cv: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Analyze this CV and provide feedback:\n\n${cv}`
      }
    ],
    model: "gpt-4o",
    temperature: 0.7
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content received from OpenAI");
  return content;
}

export async function analyzeJobDescription(description: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Analyze this job description and extract key requirements:\n\n${description}`
      }
    ],
    model: "gpt-4o",
    temperature: 0.7
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content received from OpenAI");
  return content;
}

export async function generateCoverLetter(cv: string, jobDescription: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Generate a cover letter based on this CV and job description:\n\nCV:\n${cv}\n\nJob Description:\n${jobDescription}`
      }
    ],
    model: "gpt-4o",
    temperature: 0.7
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content received from OpenAI");
  return content;
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Translate this text to ${targetLanguage}:\n\n${text}`
      }
    ],
    model: "gpt-4o",
    temperature: 0.7
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content received from OpenAI");
  return content;
} 