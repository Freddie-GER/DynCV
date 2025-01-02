import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Clean and validate URL
    let cleanUrl = url.trim()
    if (cleanUrl.startsWith('www.')) {
      cleanUrl = 'https://' + cleanUrl
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    // Validate URL format
    try {
      new URL(cleanUrl)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a complete URL starting with http:// or https://' },
        { status: 400 }
      )
    }

    // Handle Indeed URLs specially
    if (cleanUrl.includes('indeed.com')) {
      try {
        // Launch browser with additional settings
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
          ]
        })

        // Create a new page
        const page = await browser.newPage()

        // Set viewport
        await page.setViewport({ width: 1280, height: 800 })

        // Set multiple headers to look more like a real browser
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Upgrade-Insecure-Requests': '1'
        })

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        // Enable JavaScript
        await page.setJavaScriptEnabled(true)

        // Set cookies to look more like a real browser
        await page.setCookie({
          name: 'indeed_pref',
          value: 'lang=de',
          domain: '.indeed.com'
        })

        // Navigate to the page and wait for it to load
        await page.goto(cleanUrl, { 
          waitUntil: 'networkidle0',
          timeout: 30000
        })

        // Scroll the page to simulate user behavior
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2)
        })

        // Add a small delay to ensure dynamic content is loaded
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Scroll back up
        await page.evaluate(() => {
          window.scrollTo(0, 0)
        })

        // Wait another moment
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-screenshot.png' })

        // Get the page content
        const description = await page.evaluate(() => {
          // First, let's log all elements with their classes and IDs for debugging
          const allElements = document.querySelectorAll('*')
          const elementInfo: Array<{ tag: string; id: string; class: string }> = []
          allElements.forEach(el => {
            if (el.className || el.id) {
              elementInfo.push({
                tag: el.tagName,
                id: el.id,
                class: el.className
              })
            }
          })
          console.log('Page elements:', elementInfo)

          // Get all text content from the main content area
          const mainContent = document.querySelector('main') || document.querySelector('article') || document.body
          const textContent = mainContent.innerText

          // Try to find the job description section within the text
          // Look for common section markers
          const markers = [
            'Job Description',
            'About the job',
            'Position Description',
            'Role Description',
            'Responsibilities',
            'What you will do',
            'The Role',
            'Stellenbeschreibung',
            'Über den Job',
            'Aufgaben',
            'Ihre Aufgaben',
            'Deine Aufgaben'
          ]

          for (const marker of markers) {
            const index = textContent.indexOf(marker)
            if (index !== -1) {
              // Return the text from this marker onwards
              return textContent.slice(index)
            }
          }

          // If no markers found, return all text content
          return textContent
        })

        // Close browser
        await browser.close()

        if (!description) {
          throw new Error('Could not find job description on the page')
        }

        // Clean up the text
        const cleanDescription = description
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .trim()

        return NextResponse.json({ description: cleanDescription })
      } catch (err) {
        console.error('Puppeteer error:', err)
        return NextResponse.json(
          { error: 'Failed to fetch job description from Indeed. Please try pasting the job description directly.' },
          { status: 500 }
        )
      }
    }

    // For non-Indeed URLs, continue with the regular fetch approach
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }

    const response = await fetch(cleanUrl, { headers })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch webpage: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script and style elements
    $('script').remove()
    $('style').remove()

    // Try different selectors commonly used for job descriptions
    const selectors = [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      'main',
      'article',
      '.job-description',
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="job-details"]',
      '[class*="jobDetails"]',
      '[class*="posting-"]',
      '[class*="description"]',
      '[data-automation="jobDescription"]',
      '#job-description',
      '#jobDescription',
      '.description'
    ]

    let mainContent = ''
    for (const selector of selectors) {
      const content = $(selector).first().text().trim()
      if (content.length > mainContent.length) {
        mainContent = content
      }
    }

    if (!mainContent) {
      throw new Error('Could not find job description on the page. The page might be dynamic or require JavaScript.')
    }

    // Clean up the text
    const description = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()

    return NextResponse.json({ description })

  } catch (err) {
    console.error('Error details:', err)
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching the job posting' },
      { status: 500 }
    )
  }
} 