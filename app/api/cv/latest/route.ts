import { NextResponse } from 'next/server'
import { getLatestCV } from '@/utils/supabase'
import { baseCV } from '@/data/base-cv'

export async function GET() {
  try {
    const latestCV = await getLatestCV()
    
    if (latestCV?.content) {
      // Return the CV content from the database
      return NextResponse.json({ 
        cv: latestCV.content,
        metadata: {
          title: latestCV.title,
          created_at: latestCV.created_at,
          updated_at: latestCV.updated_at
        }
      })
    }

    // Fallback to baseCV if no stored CV found
    return NextResponse.json({ 
      cv: baseCV,
      metadata: {
        title: 'Base CV',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Failed to fetch CV:', err)
    return NextResponse.json(
      { error: 'Failed to fetch CV' },
      { status: 500 }
    )
  }
} 