import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import PDFDocument from 'pdfkit';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { cv } = await request.json();

    if (!cv) {
      return NextResponse.json(
        { error: 'Missing CV data' },
        { status: 400 }
      );
    }

    // First, optimize the CV content for ATS systems
    const prompt = `You are an ATS (Applicant Tracking System) optimization expert. Format this CV content to be easily readable by ATS systems.

CV Content:
${JSON.stringify(cv, null, 2)}

Guidelines:
1. Use simple, standard section headings
2. Avoid complex formatting
3. Use standard bullet points (•)
4. Keep consistent date formats (MM/YYYY)
5. Use standard fonts
6. Include keywords naturally
7. Avoid tables, columns, or graphics
8. Use standard job titles
9. Keep the same language as the original

Return a JSON object with the optimized content in this format:
{
  "sections": [
    {
      "heading": "string",
      "content": "string",
      "format": "paragraph | bullets"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an ATS optimization expert. Format content to be easily parsed by ATS systems while maintaining all important information." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const optimizedContent = JSON.parse(content);

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Convert to buffer
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Set font
    doc.font('Helvetica');

    // Add content
    optimizedContent.sections.forEach((section: any, index: number) => {
      // Add section heading
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(section.heading)
         .moveDown(0.5);

      // Add section content
      doc.fontSize(11)
         .font('Helvetica');

      if (section.format === 'bullets') {
        const bullets = section.content.split('\n');
        bullets.forEach((bullet: string) => {
          if (bullet.trim()) {
            // Add bullet point and text separately with proper indentation
            doc.text('•', { continued: true })
               .text(bullet.trim(), {
                 indent: 10,
                 align: 'left'
               })
               .moveDown(0.2);
          }
        });
      } else {
        doc.text(section.content);
      }

      doc.moveDown(1);
    });

    doc.end();

    // Combine chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as base64
    return NextResponse.json({ 
      pdf: pdfBuffer.toString('base64'),
      message: 'ATS-optimized PDF generated successfully'
    });
  } catch (error) {
    console.error('Error generating ATS PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate ATS PDF' },
      { status: 500 }
    );
  }
} 