'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface RawApplication {
  id: string
  base_cv: any
  job_description: string
  job_title: string
  employer: string
  optimized_cv?: any
  suggestions?: string[]
  highlights?: string[]
  created_at: string
  status: 'in_progress' | 'completed'
}

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
      
      // Map snake_case to camelCase
      const parsedApplications = data.applications.map((app: RawApplication): Application => ({
        id: app.id,
        baseCV: typeof app.base_cv === 'string' ? JSON.parse(app.base_cv) : app.base_cv,
        jobDescription: app.job_description,
        jobTitle: app.job_title,
        employer: app.employer,
        optimizedCV: app.optimized_cv,
        suggestions: app.suggestions,
        highlights: app.highlights,
        created_at: app.created_at,
        status: app.status
      }))
      
      setApplications(parsedApplications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
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
                <h2 className="text-xl font-semibold">
                  {application.jobTitle || 'Untitled Position'} 
                  {application.employer && ` at ${application.employer}`}
                </h2>
                <p className="text-gray-600">Created: {new Date(application.created_at).toLocaleDateString()}</p>
                <span className={`inline-block mt-2 text-sm px-2 py-1 rounded-full ${
                  application.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="space-x-2 flex items-center">
                {application.status === 'completed' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/applications/${application.id}/print`)}
                    >
                      Print ATS CV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateCoverLetter(application.id)}
                      disabled={generatingCoverLetter === application.id}
                    >
                      {generatingCoverLetter === application.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Cover Letter'
                      )}
                    </Button>
                  </>
                )}
                {application.status === 'in_progress' && (
                  <Button
                    onClick={() => router.push(`/optimization/edit?id=${application.id}`)}
                  >
                    Continue Optimization
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={(e) => handleDelete(application.id, e)}
                  disabled={deleting === application.id}
                >
                  {deleting === application.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>

            {/* Only show highlights and suggestions if they exist and have content */}
            {application.status === 'completed' && (
              <div className="grid grid-cols-2 gap-6 mt-4">
                {application.highlights && application.highlights.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Optimization Highlights</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {application.highlights.map((highlight, index) => (
                        <li key={index} className="text-gray-600">{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {application.suggestions && application.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Suggestions</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {application.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-600">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
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