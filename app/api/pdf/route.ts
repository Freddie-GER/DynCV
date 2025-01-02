import { NextResponse } from 'next/server'
import PDFParser from 'pdf2json'

interface PDFText {
  R: { T: string }[]
}

interface PDFPage {
  Texts: PDFText[]
}

interface PDFData {
  Pages: PDFPage[]
  Meta?: any
  Info?: any
}

export async function POST(request: Request) {
  console.log('PDF route hit')
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Convert to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    console.log('Buffer created:', buffer.length, 'bytes')

    // Parse PDF
    console.log('Parsing PDF...')
    const pdfParser = new PDFParser()

    const pdfData = await new Promise<PDFData>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (data) => {
        resolve(data as PDFData)
      })
      pdfParser.on('pdfParser_dataError', (err) => {
        reject(err)
      })
      
      pdfParser.parseBuffer(buffer)
    })

    // Log the raw data structure
    console.log('Raw PDF data:', JSON.stringify(pdfData, null, 2).substring(0, 1000) + '...')

    // Convert to text
    const rawText = decodeURIComponent(pdfData.Pages
      .map(page => page.Texts
        .map(text => text.R
          .map(r => r.T)
          .join(' '))
        .join(' '))
      .join('\n'))

    return NextResponse.json({ 
      rawText,
      pageCount: pdfData.Pages.length,
      metadata: pdfData.Meta,
      info: pdfData.Info
    })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to process file',
      details: err instanceof Error ? err.stack : undefined
    })
  }
} 