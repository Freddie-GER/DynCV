import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CVData } from '@/data/base-cv';

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
    const { cv, section, chat } = await request.json();

    if (!cv || !section || !chat) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Get the current content for the section
    const currentContent = cv[section as keyof CVData];

    // Format the chat history for context
    const chatContext = chat
      .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const prompt = `You are a professional CV optimizer. Based on the chat conversation about gaps and improvements, optimize the following ${section} section of a CV.

Current Content:
${currentContent}

Chat Context:
${chatContext}

Important: Only use information that has been explicitly discussed in the chat or is present in the current content. Do not invent or assume additional experience or skills.

Provide your response in JSON format with the following structure:
{
  "optimizedContent": "The optimized content for the section",
  "explanation": "A detailed explanation of the changes made, referencing specific parts of the chat conversation that justified each change",
  "verificationNeeded": ["list any points where additional verification or information might be needed from the candidate"]
}

Guidelines:
1. Maintain a professional tone
2. Only include information that was explicitly discussed or is in the original content
3. Do not invent or assume additional experience or qualifications
4. Focus on restructuring and highlighting existing content to better match job requirements
5. If there are significant gaps that cannot be filled with the available information, note them in verificationNeeded
6. Use action verbs and quantifiable achievements that are actually present in the original content
7. If the chat hasn't provided enough information to make certain improvements, ask for clarification rather than making assumptions`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional CV optimizer that provides specific and actionable improvements based on factual information only. Never invent or assume details not explicitly provided." 
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

    const optimization = JSON.parse(content);
    
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