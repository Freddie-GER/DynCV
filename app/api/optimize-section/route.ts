import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CVData, Position } from '@/data/base-cv';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { cv, section, chat, jobDescription } = await request.json();

    if (!cv || !section || !chat || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // First, detect the language of the job posting
    const languageResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a language detector. Respond with only the full language name in English (e.g., "English", "German", etc.).'
        },
        {
          role: 'user',
          content: `Detect the language of this text:\n\n${jobDescription}`
        }
      ],
      temperature: 0,
    });

    const targetLanguage = languageResponse.choices[0]?.message?.content?.trim().toLowerCase() || 'english';

    // Get and validate the current content
    const rawContent = cv[section as keyof CVData];
    if (!rawContent) {
      throw new Error(`No content found for section: ${section}`);
    }

    // Format the chat history for context
    const chatContext = chat
      .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    // Format the current content based on section type
    const formattedContent = section === 'experience' && Array.isArray(rawContent)
      ? (rawContent as Position[]).map(exp => 
          `Position: ${exp.title}
Company: ${exp.company}
Period: ${exp.startDate} - ${exp.endDate}
${exp.location ? `Location: ${exp.location}\n` : ''}
Description:
${exp.description}`
        ).join('\n\n---\n\n')
      : String(rawContent);

    const prompt = `Optimize this CV position by incorporating the user's specific achievements from their chat message.

Current Position Content:
${formattedContent}

User's Additional Achievements (MUST be incorporated):
${chat[chat.length - 1]?.role === 'user' ? chat[chat.length - 1].content : ''}

STRICT Requirements:
1. Keep existing content and its original metrics (e.g., a 75% reduction)
2. Add ONLY information the user describes in the chat:
   - The actual tools used (PowerBI, databases)
   - The actual work performed 
   - The actual outcomes achieved
3. DO NOT enrich the content with any metrics or percentages not explicitly stated by the user or from the original content
4. Keep everything in ${targetLanguage}
5. Use bullet points for clarity

Your response must be a JSON object with this structure:
{
  "optimizedContent": [{
    "title": "Position title",
    "company": "Company name",
    "startDate": "Start date",
    "endDate": "End date",
    "location": "Location (if any)",
    "description": "Enhanced description using ONLY factual information from the original content and user's message. NO invented metrics. Use bullet points; use professional phrasing in the set target language"
  }],
  "explanation": "Description of what was changed"
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are a CV optimization expert specializing in technical and data analysis roles. Your primary task is to ensure ALL specific achievements, tools, and methods mentioned in user messages are incorporated into the optimized content. Never omit user-provided examples of technical work or quantifiable achievements.` 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const optimization = JSON.parse(content);
    
    // Handle experience section specially
    if (section === 'experience' && Array.isArray(optimization.optimizedContent)) {
      // Validate each position object
      optimization.optimizedContent = optimization.optimizedContent.map((pos: any) => ({
        title: pos.title || '',
        company: pos.company || '',
        startDate: pos.startDate || '',
        endDate: pos.endDate || '',
        location: pos.location || '',
        description: pos.description || ''
      }));
    }
    
    // Add verification needs to the chat if any exist
    if (optimization.verificationNeeded && optimization.verificationNeeded.length > 0) {
      optimization.explanation += "\n\nBefore proceeding, please clarify the following points:\n" +
        optimization.verificationNeeded.map((point: string) => `- ${point}`).join("\n");
    }
    
    return NextResponse.json(optimization);
  } catch (error) {
    console.error('Error optimizing section:', error);
    return NextResponse.json(
      { error: 'Failed to optimize section' },
      { status: 500 }
    );
  }
} 