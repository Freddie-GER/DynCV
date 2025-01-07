import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import PDFParser from 'pdf2json'
import { CVData, Position } from '@/data/base-cv'

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
  console.log('\n=== START PDF PARSING REQUEST ===')
  console.log('Timestamp:', new Date().toISOString())
  
  try {
    // Debug Step 1: Parse FormData
    console.log('\nDEBUG Step 1 - Parsing FormData')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('No file in FormData')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Debug Step 2: File Details
    console.log('\nDEBUG Step 2 - File Details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })

    // Debug Step 3: Convert to Buffer
    console.log('\nDEBUG Step 3 - Converting to Buffer')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Buffer size:', buffer.length)
    
    // Debug Step 4: Parse PDF
    console.log('\nDEBUG Step 4 - Parsing PDF')
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

    // Debug Step 5: Send to GPT for structuring
    console.log('\nDEBUG Step 5 - Sending to GPT')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a CV parser that extracts structured information from CV text. 
Output ONLY valid JSON without any additional text, markdown, or formatting.
For the experience section, carefully separate each position into its own object with company, title, startDate, endDate, location (optional), and description fields.
Dates should be in MM/YYYY format when possible.`
        },
        {
          role: 'user',
          content: `Parse this CV text into a JSON object with these fields:
- name (string)
- contact (string)
- summary (string)
- skills (string)
- experience (array of objects with: company, title, startDate, endDate, location (optional), description)
- education (string)
- languages (string)
- achievements (string)
- development (string)
- memberships (string)

Important:
1. For experience entries, separate each position into its own object
2. Keep original formatting and bullet points in descriptions
3. Include all dates and details
4. If a section is not found, use an empty string (or empty array for experience)
5. Return only valid JSON

CV Text:
${cvText}`
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      console.error('No content in GPT response')
      throw new Error('No content received from GPT')
    }

    // Debug Step 6: Parse and validate response
    console.log('\nDEBUG Step 6 - Parsing GPT response')
    const parsedData = JSON.parse(responseContent)

    // Validate that all required fields are present and have correct types
    const requiredFields: (keyof CVData)[] = [
      'name', 'contact', 'summary', 'skills', 'experience',
      'education', 'languages', 'achievements', 'development', 'memberships'
    ]

    const cvData: CVData = {
      name: '',
      contact: '',
      summary: '',
      skills: '',
      experience: [],
      education: '',
      languages: '',
      achievements: '',
      development: '',
      memberships: ''
    }

    // Copy string fields
    for (const field of requiredFields) {
      if (field === 'experience') continue // Handle separately
      if (typeof parsedData[field] !== 'string') {
        console.error(`Invalid type for field ${field}:`, typeof parsedData[field])
        throw new Error(`Invalid format for field: ${field}`)
      }
      cvData[field] = parsedData[field]
    }

    // Validate and copy experience array
    if (!Array.isArray(parsedData.experience)) {
      console.error('Experience is not an array:', parsedData.experience)
      throw new Error('Invalid format for experience: expected array')
    }

    cvData.experience = parsedData.experience.map((exp: any) => {
      if (!exp.company || !exp.title || !exp.startDate || !exp.endDate || !exp.description) {
        console.error('Invalid experience entry:', exp)
        throw new Error('Invalid experience entry: missing required fields')
      }
      const position: Position = {
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description
      }
      if (exp.location) position.location = exp.location
      return position
    })

    console.log('\nDEBUG - Successfully parsed CV')
    return NextResponse.json({ cvData })
  } catch (err) {
    console.error('\nDEBUG - Fatal error:', err)
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'Failed to parse CV PDF',
        details: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    console.log('\n=== END PDF PARSING REQUEST ===\n')
  }
} 