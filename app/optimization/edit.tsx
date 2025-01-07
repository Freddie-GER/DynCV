'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CVData, Position } from '@/data/base-cv'

interface OptimizedCV {
  content: CVData;
  suggestions: string[];
  highlights: string[];
}

interface OptimizeResponse {
  optimizedCV: OptimizedCV;
  isGerman: boolean;
}

export default function OptimizationEditPage() {
  const [originalCV, setOriginalCV] = useState<CVData | null>(null)
  const [optimizedCV, setOptimizedCV] = useState<OptimizedCV | null>(null)
  const [editedCV, setEditedCV] = useState<CVData | null>(null)
  const [isGerman, setIsGerman] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current CV
        const cvResponse = await fetch('/api/cv/latest')
        if (!cvResponse.ok) throw new Error('Failed to load CV')
        const cvData = await cvResponse.json()
        setOriginalCV(cvData.cv)

        // Get job description from session storage
        const jobDescription = sessionStorage.getItem('jobDescription')
        if (!jobDescription) throw new Error('No job description found')

        // Get optimized version
        const optimizeResponse = await fetch('/api/optimize-cv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: cvData.cv,
            jobDescription
          })
        })

        if (!optimizeResponse.ok) throw new Error('Failed to get optimization suggestions')
        const data: OptimizeResponse = await optimizeResponse.json()
        setOptimizedCV(data.optimizedCV)
        setEditedCV(data.optimizedCV.content)
        setIsGerman(data.isGerman)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load required data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSaveChanges = async () => {
    if (!editedCV) return

    try {
      setLoading(true)
      const response = await fetch('/api/cv/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cv: editedCV })
      })

      if (!response.ok) throw new Error('Failed to save optimized CV')
      router.push('/final') // Navigate to final review or download page
    } catch (err) {
      console.error('Failed to save changes:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-7xl">
        <div className="animate-pulse">Optimizing your CV...</div>
      </main>
    )
  }

  if (error || !originalCV || !optimizedCV || !editedCV) {
    return (
      <main className="container mx-auto p-4 max-w-7xl">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {error || 'Missing required data'}
        </div>
        <Button 
          onClick={() => router.back()}
          className="mt-4"
        >
          Back
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Review Optimized CV</h1>
        {isGerman && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700">
              Job description is in German. Optimized content has been provided in German.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Original CV */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Original CV</h2>
          <div className="space-y-6">
            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Name</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.name}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Contact</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.contact}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.summary}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Skills</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.skills}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Experience</h3>
              <div className="space-y-4">
                {originalCV.experience.map((position, index) => (
                  <div key={index} className="pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{position.title}</h4>
                        <p className="text-gray-600">{position.company}</p>
                        {position.location && (
                          <p className="text-gray-500 text-sm">{position.location}</p>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm whitespace-nowrap">
                        {position.startDate} - {position.endDate}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-gray-600">{position.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Education</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.education}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Languages</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.languages}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Achievements</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.achievements}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Development</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.development}</p>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Memberships</h3>
              <p className="whitespace-pre-wrap text-gray-600">{originalCV.memberships}</p>
            </section>
          </div>
        </div>

        {/* Optimized CV */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Optimized Version
            {isGerman && <span className="text-blue-600 text-sm ml-2">(in German)</span>}
          </h2>
          <div className="space-y-6">
            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Name</h3>
              <Textarea
                value={editedCV.name}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, name: e.target.value }))}
                rows={1}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Contact</h3>
              <Textarea
                value={editedCV.contact}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, contact: e.target.value }))}
                rows={2}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Summary</h3>
              <Textarea
                value={editedCV.summary}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, summary: e.target.value }))}
                rows={4}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Skills</h3>
              <Textarea
                value={editedCV.skills}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, skills: e.target.value }))}
                rows={4}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Experience</h3>
              <div className="space-y-4">
                {editedCV.experience.map((position, index) => (
                  <div key={index} className="pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Textarea
                          value={position.title}
                          onChange={(e) => {
                            const newExperience = [...editedCV.experience]
                            newExperience[index] = { ...position, title: e.target.value }
                            setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                          }}
                          rows={1}
                          className="font-medium"
                        />
                        <Textarea
                          value={position.company}
                          onChange={(e) => {
                            const newExperience = [...editedCV.experience]
                            newExperience[index] = { ...position, company: e.target.value }
                            setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                          }}
                          rows={1}
                          className="text-gray-600 mt-1"
                        />
                        {position.location && (
                          <Textarea
                            value={position.location}
                            onChange={(e) => {
                              const newExperience = [...editedCV.experience]
                              newExperience[index] = { ...position, location: e.target.value }
                              setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                            }}
                            rows={1}
                            className="text-gray-500 text-sm mt-1"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          value={position.startDate}
                          onChange={(e) => {
                            const newExperience = [...editedCV.experience]
                            newExperience[index] = { ...position, startDate: e.target.value }
                            setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                          }}
                          rows={1}
                          className="text-gray-500 text-sm w-24"
                        />
                        <span className="text-gray-500">-</span>
                        <Textarea
                          value={position.endDate}
                          onChange={(e) => {
                            const newExperience = [...editedCV.experience]
                            newExperience[index] = { ...position, endDate: e.target.value }
                            setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                          }}
                          rows={1}
                          className="text-gray-500 text-sm w-24"
                        />
                      </div>
                    </div>
                    <Textarea
                      value={position.description}
                      onChange={(e) => {
                        const newExperience = [...editedCV.experience]
                        newExperience[index] = { ...position, description: e.target.value }
                        setEditedCV(prev => ({ ...prev!, experience: newExperience }))
                      }}
                      rows={6}
                      className="mt-2 w-full"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Education</h3>
              <Textarea
                value={editedCV.education}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, education: e.target.value }))}
                rows={4}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Languages</h3>
              <Textarea
                value={editedCV.languages}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, languages: e.target.value }))}
                rows={2}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Achievements</h3>
              <Textarea
                value={editedCV.achievements}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, achievements: e.target.value }))}
                rows={4}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Development</h3>
              <Textarea
                value={editedCV.development}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, development: e.target.value }))}
                rows={4}
              />
            </section>

            <section className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Memberships</h3>
              <Textarea
                value={editedCV.memberships}
                onChange={(e) => setEditedCV(prev => ({ ...prev!, memberships: e.target.value }))}
                rows={2}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Suggestions and Highlights */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Optimization Suggestions</h3>
            <ul className="list-disc pl-5 space-y-2">
              {optimizedCV.suggestions.map((suggestion, i) => (
                <li key={i} className="text-gray-700">{suggestion}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Matching Highlights</h3>
            <ul className="list-disc pl-5 space-y-2">
              {optimizedCV.highlights.map((highlight, i) => (
                <li key={i} className="text-green-700">{highlight}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </main>
  )
} 