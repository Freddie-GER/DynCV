import { NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import OpenAI from 'openai'

const openai = new OpenAI()

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
    // 1. Get and parse PDF
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

    // Extract text
    const cvText = data.Pages.map(page => {
      return page.Texts
        .map(text => text.R
          .map(r => decodeURIComponent(r.T))
          .join(''))
        .join(' ')
    }).join('\n\n')

    // 2. Send to GPT-4o-mini for structuring
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a JSON formatter. Output ONLY valid JSON without any additional text, markdown, or formatting.'
        },
        {
          role: 'user',
          content: `Convert this CV text into a JSON object with these fields: name (string), contact (string), summary (string), skills (string), experience (array of objects with company, role, period, description), education (array of objects with institution, degree, period), languages (string), achievements (string), development (string), memberships (string).

CV Text:
${cvText}`
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }  // Force JSON output
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('No response from GPT')
    }

    const structuredCV = JSON.parse(responseContent)

    return NextResponse.json({ 
      message: 'CV parsed successfully',
      cv: structuredCV
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      message: 'Error processing CV',
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof Error ? error.stack : undefined
    })
  }
} 