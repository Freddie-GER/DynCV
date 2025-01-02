'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface CVData {
  name: string
  contact: string
  summary: string
  skills: string
  experience: string
  education: string
  languages: string
  achievements: string
  development: string
  memberships: string
}

interface OptimizedCV {
  content: Partial<CVData>
  suggestions: string[]
  highlights: string[]
}

interface Props {
  baseCV: CVData
  optimizedCV: OptimizedCV | null
  jobTitle: string
  onSave: (optimizedData: CVData) => void
}

export default function CVComparison({ baseCV, optimizedCV, jobTitle, onSave }: Props) {
  const [editedCV, setEditedCV] = useState<Partial<CVData> | null>(null)

  useEffect(() => {
    if (optimizedCV) {
      setEditedCV(optimizedCV.content)
    }
  }, [optimizedCV])

  const handleSave = () => {
    if (editedCV) {
      // Merge the edited fields with the base CV
      onSave({
        ...baseCV,
        ...editedCV
      })
    }
  }

  const handleFieldChange = (field: keyof CVData, value: string) => {
    if (editedCV) {
      setEditedCV(prev => ({
        ...prev!,
        [field]: value
      }))
    }
  }

  if (!optimizedCV || !editedCV) return null

  // Get the fields that have changes
  const changedFields = Object.keys(editedCV) as Array<keyof CVData>

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">CV Optimization for {jobTitle}</h2>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Original Content */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Current Content</h3>
          <div className="space-y-4">
            {changedFields.map(field => (
              <section key={field}>
                <h4 className="font-medium mb-2">{field.charAt(0).toUpperCase() + field.slice(1)}</h4>
                <p className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{baseCV[field]}</p>
              </section>
            ))}
          </div>
        </div>

        {/* Optimized Content */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Suggested Changes</h3>
          <div className="space-y-4">
            {changedFields.map(field => (
              <section key={field}>
                <h4 className="font-medium mb-2">{field.charAt(0).toUpperCase() + field.slice(1)}</h4>
                <Textarea
                  value={editedCV[field]}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  rows={field === 'experience' ? 8 : field === 'summary' || field === 'skills' ? 4 : 2}
                />
              </section>
            ))}
            <Button onClick={handleSave} className="mt-4">Save Changes</Button>
          </div>
        </div>
      </div>

      {/* Suggestions and Highlights */}
      <div className="mt-8 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Suggestions</h3>
          <ul className="list-disc pl-5 space-y-2">
            {optimizedCV.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Matching Highlights</h3>
          <ul className="list-disc pl-5 space-y-2">
            {optimizedCV.highlights.map((highlight, i) => (
              <li key={i}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 