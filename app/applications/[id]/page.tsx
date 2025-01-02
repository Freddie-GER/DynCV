'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Application {
  id: string
  baseCV: any
  jobDescription: string
  jobTitle: string
  employer: string
  optimizedCV?: any
  suggestions?: string[]
  highlights?: string[]
  created_at: string
  status: 'in_progress' | 'completed'
}

export default function ApplicationPage({ params }: { params: { id: string } }) {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadApplication()
  }, [params.id])

  const loadApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`)
      if (!response.ok) throw new Error('Failed to load application')
      const data = await response.json()
      setApplication(data.application)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateATS = async () => {
    if (!application?.optimizedCV) return
    
    try {
      setGeneratingPDF(true)
      const response = await fetch('/api/generate-ats-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cv: application.optimizedCV })
      })

      if (!response.ok) throw new Error('Failed to generate ATS PDF')
      const data = await response.json()

      // Download PDF
      const pdfBlob = new Blob(
        [Buffer.from(data.pdf, 'base64')],
        { type: 'application/pdf' }
      )
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ATS_Optimized_CV_${application.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ATS PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!application?.optimizedCV) return

    try {
      setGeneratingCoverLetter(true)
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv: application.optimizedCV,
          jobDescription: application.jobDescription
        })
      })

      if (!response.ok) throw new Error('Failed to generate cover letter')
      const data = await response.json()
      // Handle cover letter display
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter')
    } finally {
      setGeneratingCoverLetter(false)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">Loading application...</div>
      </main>
    )
  }

  if (!application) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="text-red-600">Application not found</div>
        <Button onClick={() => router.push('/applications')} className="mt-4">
          Back to Applications
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/applications')}
            className="mb-4"
          >
            ← Back to Applications
          </Button>
          <h1 className="text-3xl font-bold">{application.jobTitle}</h1>
          <p className="text-xl text-gray-600">{application.employer}</p>
        </div>
        <div className="space-x-4">
          {application.optimizedCV ? (
            <>
              <Button
                variant="outline"
                onClick={handleGenerateATS}
                disabled={generatingPDF}
              >
                {generatingPDF ? 'Generating...' : 'Generate ATS PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateCoverLetter}
                disabled={generatingCoverLetter}
              >
                {generatingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push(`/optimization?id=${application.id}`)}
            >
              Continue Optimization
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Application Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Created:</span>{' '}
                {new Date(application.created_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                  application.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </p>
            </div>
          </div>

          {application.optimizedCV && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Optimization Results</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Highlights</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {application.highlights?.map((highlight, i) => (
                      <li key={i} className="text-gray-600">{highlight}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {application.suggestions?.map((suggestion, i) => (
                      <li key={i} className="text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{application.jobDescription}</p>
          </div>
        </div>
      </div>
    </main>
  )
} 