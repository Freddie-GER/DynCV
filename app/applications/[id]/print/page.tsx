'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { CVData, Position } from '@/data/base-cv'

export default function PrintView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [cv, setCV] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadCV = async () => {
      try {
        const response = await fetch(`/api/applications/${params.id}`)
        if (!response.ok) throw new Error('Failed to load application')
        const data = await response.json()
        if (!data.application?.optimized_cv?.content) {
          throw new Error('No CV content found')
        }
        setCV(data.application.optimized_cv.content)
      } catch (err) {
        console.error('Failed to load CV:', err)
        setError(err instanceof Error ? err.message : 'Failed to load CV')
      } finally {
        setLoading(false)
      }
    }

    loadCV()
  }, [params.id])

  useEffect(() => {
    if (!loading && !error && cv) {
      window.print()
    }
  }, [loading, error, cv])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error || !cv) {
    return <div>Error: {error || 'No CV data available'}</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-roboto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{cv.name}</h1>
        <div className="text-gray-600">{cv.contact}</div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Professional Summary</h2>
        <p className="leading-relaxed">{cv.summary}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <p className="leading-relaxed">{cv.skills}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Experience</h2>
        <div className="space-y-4">
          {(() => {
            if (!cv.experience) {
              return <p>No experience data available</p>;
            }

            const experiences = Array.isArray(cv.experience) 
              ? cv.experience 
              : [cv.experience];

            return experiences.map((position: any, index: number) => {
              // Ensure position has all required fields
              if (!position || typeof position !== 'object') {
                return null;
              }

              return (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{position.title || 'Unknown Title'}</h3>
                      <div className="text-gray-600">{position.company || 'Unknown Company'}</div>
                      {position.location && (
                        <div className="text-gray-500">{position.location}</div>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {position.startDate || 'N/A'} - {position.endDate || 'Present'}
                    </div>
                  </div>
                  <p className="mt-2 leading-relaxed">{position.description || 'No description available'}</p>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Education</h2>
        <p className="leading-relaxed">{cv.education}</p>
      </div>

      {cv.languages && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Languages</h2>
          <p className="leading-relaxed">{cv.languages}</p>
        </div>
      )}

      {cv.achievements && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Achievements</h2>
          <p className="leading-relaxed">{cv.achievements}</p>
        </div>
      )}

      {cv.development && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Professional Development</h2>
          <p className="leading-relaxed">{cv.development}</p>
        </div>
      )}

      {cv.memberships && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Memberships</h2>
          <p className="leading-relaxed">{cv.memberships}</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            font-family: 'Roboto', sans-serif;
            line-height: 1.6;
            color: #000;
          }
          a {
            text-decoration: none;
            color: inherit;
          }
        }
      `}</style>
    </div>
  )
} 