'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import CVUpload from '@/components/CVUpload'
import { CVData } from '@/data/base-cv'

interface RawApplication {
  id: string;
  base_cv: any;
  job_description: string;
  job_title: string;
  employer: string;
  created_at: string;
  status: 'in_progress' | 'completed';
}

interface Application {
  id: string;
  baseCV: CVData;
  jobDescription: string;
  jobTitle: string;
  employer: string;
  created_at: string;
  status: 'in_progress' | 'completed';
}

export default function Home() {
  const [currentCV, setCurrentCV] = useState<CVData | null>(null)
  const [hasStoredCV, setHasStoredCV] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    checkStoredCV()
    loadApplications()
  }, [])

  const checkStoredCV = async () => {
    try {
      const response = await fetch('/api/cv/latest')
      const data = await response.json()
      setHasStoredCV(!data.error && data.cv)
    } catch (err) {
      console.error('Failed to check stored CV:', err)
    }
  }

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (!response.ok) throw new Error('Failed to load applications')
      const data = await response.json()
      const parsedApplications = data.applications.map((app: RawApplication): Application => ({
        id: app.id,
        baseCV: typeof app.base_cv === 'string' ? JSON.parse(app.base_cv) : app.base_cv,
        jobDescription: app.job_description,
        jobTitle: app.job_title,
        employer: app.employer,
        created_at: app.created_at,
        status: app.status
      }))
      setApplications(parsedApplications)
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCVChange = (cv: CVData) => {
    setCurrentCV(cv)
    sessionStorage.setItem('selectedCV', JSON.stringify(cv))
  }

  const handleLoadStoredCV = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cv/latest')
      if (!response.ok) throw new Error('Failed to load CV')
      const data = await response.json()
      setCurrentCV(data.cv)
      sessionStorage.setItem('selectedCV', JSON.stringify(data.cv))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CV')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNew = () => {
    if (currentCV) {
      router.push('/job-matching')
    }
  }

  const handleViewApplications = () => {
    router.push('/applications')
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-5xl">
        <div className="animate-pulse">Loading...</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Dynamic CV Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Start New Application */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Start New Application</h2>
            
            {hasStoredCV && (
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  Use your existing CV to start a new application:
                </p>
                <Button 
                  onClick={handleLoadStoredCV} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Use Previous CV'}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or upload new</span>
                  </div>
                </div>
              </div>
            )}
            
            <CVUpload onCVChange={handleCVChange} />

            {currentCV && (
              <Button 
                onClick={handleStartNew}
                className="w-full mt-4"
              >
                Start New Application
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Existing Applications */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.slice(0, 3).map(app => (
                  <div 
                    key={app.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/applications/${app.id}`)}
                  >
                    <h3 className="font-medium">{app.jobTitle} at {app.employer}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}

                <Button
                  onClick={handleViewApplications}
                  variant="outline"
                  className="w-full mt-2"
                >
                  View All Applications
                </Button>
              </div>
            ) : (
              <p className="text-gray-600">No applications yet. Start by creating a new one!</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md mt-6">
          {error}
        </div>
      )}
    </main>
  )
}



