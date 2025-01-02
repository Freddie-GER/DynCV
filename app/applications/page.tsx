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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (!response.ok) throw new Error('Failed to load applications')
      const data = await response.json()
      setApplications(data.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateATS = async (applicationId: string) => {
    try {
      setGeneratingPDF(applicationId)
      const application = applications.find(app => app.id === applicationId)
      if (!application) throw new Error('Application not found')

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
      a.download = `ATS_Optimized_CV_${applicationId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ATS PDF')
    } finally {
      setGeneratingPDF(null)
    }
  }

  const handleGenerateCoverLetter = async (applicationId: string) => {
    try {
      setGeneratingCoverLetter(applicationId)
      const application = applications.find(app => app.id === applicationId)
      if (!application) throw new Error('Application not found')

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
      
      // Show cover letter for this application
      setSelectedApplication(applicationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter')
    } finally {
      setGeneratingCoverLetter(null)
    }
  }

  const handleDelete = async (applicationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent navigation when clicking delete
    
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(applicationId)
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete application')
      
      // Remove the application from the state
      setApplications(apps => apps.filter(app => app.id !== applicationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">Loading applications...</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Applications</h1>
        <Button onClick={() => router.push('/')}>New Application</Button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {applications.map(application => (
          <div key={application.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{application.jobTitle} at {application.employer}</h2>
                <p className="text-gray-600">Created: {new Date(application.created_at).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  application.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="space-x-4 flex items-center">
                {application.optimizedCV && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateATS(application.id)}
                      disabled={generatingPDF === application.id}
                    >
                      {generatingPDF === application.id ? 'Generating...' : 'Generate ATS PDF'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateCoverLetter(application.id)}
                      disabled={generatingCoverLetter === application.id}
                    >
                      {generatingCoverLetter === application.id ? 'Generating...' : 'Generate Cover Letter'}
                    </Button>
                  </>
                )}
                {!application.optimizedCV && (
                  <Button
                    onClick={() => router.push(`/optimization?id=${application.id}`)}
                  >
                    Continue Optimization
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={(e) => handleDelete(application.id, e)}
                  disabled={deleting === application.id}
                  className="ml-4"
                >
                  {deleting === application.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>

            {application.optimizedCV && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Optimization Highlights</h3>
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
            )}

            {selectedApplication === application.id && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-4">Generated Cover Letter</h3>
                {/* Cover letter content will be added here when generated */}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
} 