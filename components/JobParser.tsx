'use client'

import { useState, useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import CVComparison from './CVComparison'
import { baseCV, CVData, Position } from '../data/base-cv'
import CVManager from './CVManager'
import { JobAnalysis } from '../types/job-analysis'

interface OptimizedCV {
  content: Partial<CVData>;
  suggestions: string[];
  highlights: string[];
}

interface Props {
  currentCV: CVData;
  onCVUpdate: (cv: CVData) => void;
}

export default function JobParser({ currentCV, onCVUpdate }: Props) {
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [optimizedCV, setOptimizedCV] = useState<OptimizedCV | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlFetch = async () => {
    if (!jobUrl) return
    setLoading(true)
    setError('')
    setDebugInfo('')
    
    try {
      // Clean and format URL
      let cleanUrl = jobUrl.trim()
      if (cleanUrl.startsWith('www.')) {
        cleanUrl = 'https://' + cleanUrl
      }
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl
      }

      const response = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job posting')
      }

      setJobDescription(data.description)

      // Automatically analyze the job after fetching
      const analysisResponse = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: data.description }),
      })

      const analysisData = await analysisResponse.json()

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'Failed to analyze job posting')
      }

      setAnalysis(analysisData.analysis)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching/analyzing job:', err)
      setDebugInfo(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setDebugInfo('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/parse-job-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF')
      }

      if (!data.content) {
        throw new Error('No content found in PDF')
      }

      setJobDescription(data.content)
    } catch (err) {
      console.error('Error loading job description:', err)
      setError(err instanceof Error ? err.message : 'Error loading PDF file')
      setDebugInfo(JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : '',
        type: file.type,
        name: file.name,
        size: file.size
      }, null, 2))
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  };

  const handleOptimizeCV = async () => {
    if (!analysis || !currentCV) {
      setError('Please provide both job analysis and CV content')
      return
    }

    setLoading(true)
    setError('')
    setDebugInfo('')
    
    try {
      const cvContent = `
Name: ${currentCV.name}

Contact Information:
${currentCV.contact}

Professional Summary:
${currentCV.summary}

Skills:
${currentCV.skills}

Professional Experience:
${currentCV.experience.map((position: Position) => `
Company: ${position.company}
Title: ${position.title}
Period: ${position.startDate} - ${position.endDate}
${position.location ? `Location: ${position.location}\n` : ''}
Description:
${position.description}
`).join('\n---\n')}

Education:
${currentCV.education}

Languages:
${currentCV.languages}

Achievements:
${currentCV.achievements}

Continuing Development:
${currentCV.development}

Professional Memberships:
${currentCV.memberships}
`

      const optimizeResponse = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cvContent,
          jobAnalysis: analysis
        }),
      })

      const optimizeData = await optimizeResponse.json()

      if (!optimizeResponse.ok) {
        throw new Error(optimizeData.error || 'Failed to optimize CV')
      }

      setOptimizedCV(optimizeData.optimizedCV)
    } catch (err: any) {
      setError(err.message)
      console.error('Error optimizing CV:', err)
      setDebugInfo(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOptimizedCV = async (optimizedData: any) => {
    try {
      // Here you would typically save the optimized CV to your backend
      // For now, we'll just log it
      console.log('Saving optimized CV:', optimizedData)
      
      // You can also update the local state if needed
      onCVUpdate(optimizedData)
    } catch (err: any) {
      setError(err.message)
      console.error('Error saving optimized CV:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription) {
      setError('Please provide a job description')
      return
    }

    setLoading(true)
    setError('')
    setDebugInfo('')
    
    try {
      const analysisResponse = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      })

      const analysisData = await analysisResponse.json()

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'Failed to analyze job posting')
      }

      setAnalysis(analysisData.analysis)
    } catch (err: any) {
      setError(err.message)
      console.error('Error analyzing job:', err)
      setDebugInfo(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Job Parser</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="jobUrl" className="text-sm font-medium">Job URL</label>
          <div className="flex gap-2">
            <Input
              id="jobUrl"
              type="url"
              value={jobUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobUrl(e.target.value)}
              placeholder="Enter job posting URL"
            />
            <Button 
              type="button" 
              onClick={handleUrlFetch}
              disabled={loading || !jobUrl}
              variant="outline"
            >
              {loading ? 'Fetching & Analyzing...' : 'Fetch & Analyze'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Upload PDF</label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Choose PDF
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="jobDescription" className="text-sm font-medium">Job Description</label>
          <Textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            placeholder="Job description will appear here, or paste it manually"
            rows={10}
          />
        </div>

        <Button type="submit" disabled={loading || !jobDescription}>
          {loading ? 'Analyzing...' : 'Analyze Job'}
        </Button>
      </form>

      {error && (
        <div className="space-y-2">
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
          {debugInfo && (
            <div className="p-4 bg-gray-50 text-gray-800 rounded-md">
              <h4 className="font-medium mb-2">Debug Information:</h4>
              <pre className="whitespace-pre-wrap text-sm">{debugInfo}</pre>
            </div>
          )}
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">{analysis.title}</h3>
          
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Key Requirements</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Explicitly Stated</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {analysis.keyRequirements
                    .filter(req => req.type === 'explicit')
                    .map((req: JobAnalysis['keyRequirements'][0], i: number) => (
                      <li key={i} className="relative group">
                        {req.text}
                        {req.source && (
                          <span className="hidden group-hover:block absolute left-0 -top-8 bg-gray-800 text-white p-2 rounded text-sm">
                            Source: {req.source}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Inferred from Context</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  {analysis.keyRequirements
                    .filter(req => req.type === 'inferred')
                    .map((req: JobAnalysis['keyRequirements'][0], i: number) => (
                      <li key={i}>{req.text}</li>
                    ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Required Skills</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Explicitly Stated</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {analysis.suggestedSkills
                    .filter(skill => skill.type === 'explicit')
                    .map((skill: JobAnalysis['suggestedSkills'][0], i: number) => (
                      <li key={i} className="relative group">
                        {skill.text}
                        {skill.source && (
                          <span className="hidden group-hover:block absolute left-0 -top-8 bg-gray-800 text-white p-2 rounded text-sm">
                            Source: {skill.source}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Inferred from Context</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  {analysis.suggestedSkills
                    .filter(skill => skill.type === 'inferred')
                    .map((skill: JobAnalysis['suggestedSkills'][0], i: number) => (
                      <li key={i}>{skill.text}</li>
                    ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Recommended Highlights</h3>
            <ul className="list-disc pl-5 space-y-2">
              {analysis.recommendedHighlights.map((highlight: string, i: number) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </section>

          <div className="space-y-2">
            <Button 
              onClick={handleOptimizeCV}
              disabled={loading || !currentCV}
            >
              {loading ? 'Optimizing...' : 'Optimize CV for This Job'}
            </Button>
          </div>
        </div>
      )}

      {optimizedCV && currentCV && analysis && (
        <CVComparison
          baseCV={currentCV}
          optimizedCV={optimizedCV}
          jobTitle={analysis.title}
          onSave={handleSaveOptimizedCV}
        />
      )}
    </div>
  )
}

