import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { CVData } from '@/data/base-cv'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const { messages, cv } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful CV review assistant. Your task is to help users verify and update their CV information.
          
When suggesting updates:
1. Be specific about what needs to be changed
2. Maintain the original formatting
3. Keep all dates and details accurate
4. Preserve the professional tone
5. Return any CV updates in valid JSON format matching the original structure`
        },
        ...messages
      ],
      temperature: 0.7
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('No response from assistant')
    }

    // Check if the response contains a CV update
    const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/)
    let updatedCV: CVData | undefined

    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1]
        const parsed = JSON.parse(jsonStr)
        
        // Validate the structure matches CVData
        if (typeof parsed === 'object' && parsed !== null) {
          const requiredFields: (keyof CVData)[] = [
            'name', 'contact', 'summary', 'skills', 'experience',
            'education', 'languages', 'achievements', 'development', 'memberships'
          ]

          const isValid = requiredFields.every(field => 
            typeof parsed[field] === 'string'
          )

          if (isValid) {
            updatedCV = parsed as CVData
          }
        }
      } catch (e) {
        console.error('Failed to parse CV update:', e)
      }
    }

    // Clean up the response by removing the JSON block
    const message = responseContent.replace(/```json\n[\s\S]*?\n```/g, '')
      .trim()
      .replace(/\n{3,}/g, '\n\n')

    return NextResponse.json({ 
      message,
      updatedCV
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'Failed to process chat',
        details: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    )
  }
} 