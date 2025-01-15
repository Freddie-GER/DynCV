'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CVData, Position } from '@/data/base-cv'
import { JobAnalysis, JobRequirement } from '@/utils/openai'

export default function OptimizationPage() {
  const [currentCV, setCurrentCV] = useState<CVData | null>(null)
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get application data from session storage
        const applicationId = sessionStorage.getItem('currentApplicationId')
        console.log('Application ID from session:', applicationId)
        if (!applicationId) throw new Error('No application ID found')

        const response = await fetch(`/api/applications/${applicationId}`)
        if (!response.ok) throw new Error('Failed to load application')
        const data = await response.json()
        console.log('Application data:', data)
        
        // Parse the base_cv if it's a string
        const baseCV = typeof data.application.base_cv === 'string' 
          ? JSON.parse(data.application.base_cv)
          : data.application.base_cv

        // Ensure experience is an array
        if (baseCV.experience && !Array.isArray(baseCV.experience)) {
          baseCV.experience = [];
          console.warn('Experience field was not an array, defaulting to empty array');
        }

        console.log('Parsed baseCV:', baseCV)
        setCurrentCV(baseCV)

        // Load job description from session storage
        const storedJob = sessionStorage.getItem('jobDescription')
        console.log('Job description from session:', storedJob ? storedJob.substring(0, 100) + '...' : null)
        if (!storedJob) throw new Error('No job description found')

        // Get job analysis
        const analysisResponse = await fetch('/api/analyze-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobDescription: storedJob })
        })

        if (!analysisResponse.ok) throw new Error('Failed to analyze job description')
        const analysisData = await analysisResponse.json()
        console.log('Job analysis:', analysisData)
        setJobAnalysis(analysisData.analysis)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load required data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleBeginOptimization = () => {
    router.push('/optimization/edit')
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">Loading CV and job analysis...</div>
      </main>
    )
  }

  if (error || !currentCV || !jobAnalysis) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {error || 'Missing required data'}
        </div>
        <Button 
          onClick={() => router.push('/job-matching')}
          className="mt-4"
        >
          Back to Job Description
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">CV and Job Analysis</h1>
      
      <div className="grid grid-cols-2 gap-8">
        {/* CV Content */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Your CV</h2>
          <div className="space-y-6">
            {Object.entries(currentCV).map(([key, value]) => (
              <section key={key} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2 capitalize">{key}</h3>
                {key === 'experience' ? (
                  <div className="space-y-4">
                    {Array.isArray(value) ? value.map((position: Position, index) => (
                      <div key={index} className="pl-4 border-l-2 border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{position.title}</div>
                            <div className="text-gray-600">{position.company}</div>
                            {position.location && (
                              <div className="text-gray-500 text-sm">{position.location}</div>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm whitespace-nowrap">
                            {position.startDate} - {position.endDate}
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{position.description}</p>
                      </div>
                    )) : (
                      <div className="pl-4 border-l-2 border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{value.title}</div>
                            <div className="text-gray-600">{value.company}</div>
                            {value.location && (
                              <div className="text-gray-500 text-sm">{value.location}</div>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm whitespace-nowrap">
                            {value.startDate} - {value.endDate}
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600 whitespace-pre-wrap">{value.description}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-gray-600">{value as string}</p>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Job Analysis */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Job Requirements</h2>
          <div className="space-y-6">
            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Key Requirements</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Explicitly Stated</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {jobAnalysis.keyRequirements
                      .filter(req => req.type === 'explicit')
                      .map((req, i) => (
                        <li key={i} className="group relative">
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
                    {jobAnalysis.keyRequirements
                      .filter(req => req.type === 'inferred')
                      .map((req, i) => (
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
                    {jobAnalysis.suggestedSkills
                      .filter(skill => skill.type === 'explicit')
                      .map((skill, i) => (
                        <li key={i} className="group relative">
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
                    {jobAnalysis.suggestedSkills
                      .filter(skill => skill.type === 'inferred')
                      .map((skill, i) => (
                        <li key={i}>{skill.text}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Cultural Fit</h3>
              <div className="space-y-4">
                {jobAnalysis.culturalFit.explicit && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Explicitly Stated</h4>
                    <p className="text-gray-600">{jobAnalysis.culturalFit.explicit}</p>
                  </div>
                )}
                {jobAnalysis.culturalFit.inferred && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Inferred from Context</h4>
                    <p className="text-gray-600">{jobAnalysis.culturalFit.inferred}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Recommended Highlights</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Explicitly Stated</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    {jobAnalysis.recommendedHighlights
                      .filter(highlight => highlight.type === 'explicit')
                      .map((highlight, i) => (
                        <li key={i} className="group relative">
                          {highlight.text}
                          {highlight.source && (
                            <span className="hidden group-hover:block absolute left-0 -top-8 bg-gray-800 text-white p-2 rounded text-sm">
                              Source: {highlight.source}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Inferred from Context</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {jobAnalysis.recommendedHighlights
                      .filter(highlight => highlight.type === 'inferred')
                      .map((highlight, i) => (
                        <li key={i}>{highlight.text}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/job-matching')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={handleBeginOptimization}
          disabled={loading}
        >
          Begin Optimization
        </Button>
      </div>
    </main>
  )
} 