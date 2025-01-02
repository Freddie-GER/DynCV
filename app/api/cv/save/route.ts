import { NextResponse } from 'next/server'
import { saveCV } from '@/utils/supabase'
import { CVData } from '@/data/base-cv'

export async function POST(request: Request) {
  try {
    console.log('Starting CV save process...')
    const { cv } = await request.json()

    // Validate CV structure
    const requiredFields: (keyof CVData)[] = [
      'name', 'contact', 'summary', 'skills', 'experience',
      'education', 'languages', 'achievements', 'development', 'memberships'
    ]

    console.log('Validating CV fields...')
    const isValid = requiredFields.every(field => 
      typeof cv[field] === 'string'
    )

    if (!isValid) {
      console.error('Invalid CV format')
      return NextResponse.json(
        { error: 'Invalid CV format' },
        { status: 400 }
      )
    }

    console.log('CV validation passed, attempting to save...')
    // Store CV in Supabase
    const savedCV = await saveCV(cv)
    console.log('CV saved successfully:', savedCV)

    return NextResponse.json({ 
      success: true,
      cv: savedCV[0]
    })
  } catch (err) {
    console.error('Failed to save CV:', err)
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to save CV',
        details: err instanceof Error ? err.message : String(err),
        code: (err as any)?.code
      },
      { status: 500 }
    )
  }
} 