import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    try {
      // Extract text from PDF
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const data = await pdfParse(buffer)
      const content = data.text

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'No text content could be extracted from the PDF' },
          { status: 400 }
        )
      }

      return NextResponse.json({ content })
    } catch (pdfError: any) {
      console.error('PDF processing error:', pdfError)
      return NextResponse.json(
        { error: pdfError.message || 'Failed to process PDF file' },
        { status: 500 }
      )
    }
  } catch (err: any) {
    console.error('General error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to parse PDF' },
      { status: 500 }
    )
  }
} 