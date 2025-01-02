'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function JobMatching() {
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [employer, setEmployer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentCV, setCurrentCV] = useState(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadCurrentCV()
  }, [])

  const loadCurrentCV = async () => {
    try {
      const response = await fetch('/api/cv/latest')
      if (!response.ok) throw new Error('Failed to load CV')
      const data = await response.json()
      setCurrentCV(data.cv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CV')
    }
  }

  const extractJobDetails = async (description: string) => {
    try {
      const response = await fetch('/api/extract-job-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: description })
      });

      if (!response.ok) throw new Error('Failed to extract job details');
      const data = await response.json();
      
      setJobTitle(data.jobTitle);
      setEmployer(data.employer);
    } catch (err) {
      console.error('Failed to extract job details:', err);
      // Don't show error to user, just leave fields empty for manual input
    }
  };

  const handleUrlFetch = async () => {
    if (!jobUrl) return
    
    setLoading(true)
    setError('')
    
    try {
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
      if (!response.ok) throw new Error(data.error)
      
      setJobDescription(data.description)
      await extractJobDetails(data.description)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job posting')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/parse-job-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setJobDescription(data.content)
      await extractJobDetails(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleJobDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setJobDescription(newDescription);
    
    // Only try to extract if there's enough content
    if (newDescription.length > 50) {
      await extractJobDetails(newDescription);
    }
  };

  const saveApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseCV: currentCV,
          jobDescription: jobDescription,
          jobTitle: jobTitle || 'Untitled Position',
          employer: employer || 'Unknown Employer',
          status: 'in_progress'
        })
      })

      if (!response.ok) throw new Error('Failed to save application')
      const data = await response.json()
      
      sessionStorage.setItem('currentApplicationId', data.application.id)
      sessionStorage.setItem('jobDescription', jobDescription)

      return data.application.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToOptimization = async () => {
    try {
      await saveApplication()
      router.push('/optimization')
    } catch (err) {
      console.error('Failed to save before proceeding:', err)
    }
  }

  const handleSaveProgress = async () => {
    try {
      await saveApplication()
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Job Matching</h1>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-2xl font-semibold">Add Job Description</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="jobUrl" className="text-sm font-medium">Job URL</label>
              <div className="flex gap-2">
                <Input
                  id="jobUrl"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="Enter job posting URL"
                />
                <Button 
                  onClick={handleUrlFetch}
                  disabled={loading || !jobUrl}
                  variant="outline"
                >
                  {loading ? 'Fetching...' : 'Fetch'}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div>
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Choose PDF
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div>
              <label htmlFor="jobDescription" className="text-sm font-medium">Manual Input</label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                placeholder="Paste job description here"
                className="min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobTitle" className="text-sm font-medium">Job Title</label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Developer"
                />
              </div>
              <div>
                <label htmlFor="employer" className="text-sm font-medium">Employer</label>
                <Input
                  id="employer"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {jobDescription && (
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleSaveProgress}
                disabled={loading}
                variant="outline"
              >
                Save Progress
              </Button>
              <Button
                onClick={handleProceedToOptimization}
                disabled={loading}
              >
                Proceed to Optimization
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 