'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CVData } from '@/data/base-cv'

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
            {Object.entries(originalCV!).map(([key, value]) => (
              <section key={key} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2 capitalize">{key}</h3>
                <p className="whitespace-pre-wrap text-gray-600">{value}</p>
              </section>
            ))}
          </div>
        </div>

        {/* Optimized CV */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">
            Optimized Version
            {isGerman && <span className="text-blue-600 text-sm ml-2">(in German)</span>}
          </h2>
          <div className="space-y-6">
            {Object.entries(editedCV!).map(([key, value]) => (
              <section key={key} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2 capitalize">{key}</h3>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  value={value}
                  onChange={(e) => {
                    setEditedCV(prev => ({
                      ...prev!,
                      [key]: e.target.value
                    }))
                  }}
                />
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions and Highlights */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Optimization Suggestions</h3>
            <ul className="list-disc pl-5 space-y-2">
              {optimizedCV!.suggestions.map((suggestion, i) => (
                <li key={i} className="text-gray-700">{suggestion}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Matching Highlights</h3>
            <ul className="list-disc pl-5 space-y-2">
              {optimizedCV!.highlights.map((highlight, i) => (
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