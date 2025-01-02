import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: Request) {
  console.log('Received PDF upload request')
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('File received:', file.name)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Buffer created:', buffer.length, 'bytes')
    
    const data = await pdfParse(buffer)
    console.log('PDF parsed, text length:', data.text.length)
    
    return NextResponse.json({ 
      text: data.text
    })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to read PDF' })
  }
} 