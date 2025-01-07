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
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const pdfParser = new PDFParser()
    
    const data = await new Promise<PDFData>((resolve, reject) => {
      pdfParser.on('pdfParser_dataReady', (data) => resolve(data as PDFData))
      pdfParser.on('pdfParser_dataError', reject)
      pdfParser.parseBuffer(buffer)
    })

    // Extract and decode text from each page
    const decodedText = data.Pages.map(page => {
      return page.Texts
        .map(text => text.R
          .map(r => decodeURIComponent(r.T))
          .join(''))
        .join(' ')
    }).join('\n\n')

    return NextResponse.json({ 
      message: 'Got PDF content',
      text: decodedText,
      pageCount: data.Pages.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      message: 'Error processing PDF',
      error: error instanceof Error ? error.message : String(error)
    })
  }
} 