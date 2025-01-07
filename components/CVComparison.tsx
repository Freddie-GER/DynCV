'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { CVData, Position } from '@/data/base-cv'

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

  const handleFieldChange = (field: keyof CVData, value: any) => {
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
                {field === 'experience' ? (
                  <div className="space-y-4">
                    {baseCV.experience.map((position, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{position.title}</div>
                            <div>{position.company}</div>
                            {position.location && <div className="text-sm">{position.location}</div>}
                          </div>
                          <div className="text-sm">
                            {position.startDate} - {position.endDate}
                          </div>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap">{position.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bg-gray-50 p-2 rounded whitespace-pre-wrap">{baseCV[field]}</p>
                )}
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
                {field === 'experience' ? (
                  <div className="space-y-4">
                    {editedCV.experience?.map((position: Position, index: number) => (
                      <div key={index} className="space-y-2">
                        <Textarea
                          value={position.title}
                          onChange={(e) => {
                            const newExperience = [...(editedCV.experience || [])]
                            newExperience[index] = { ...position, title: e.target.value }
                            handleFieldChange('experience', newExperience)
                          }}
                          placeholder="Job Title"
                          className="font-medium"
                        />
                        <Textarea
                          value={position.company}
                          onChange={(e) => {
                            const newExperience = [...(editedCV.experience || [])]
                            newExperience[index] = { ...position, company: e.target.value }
                            handleFieldChange('experience', newExperience)
                          }}
                          placeholder="Company"
                        />
                        <div className="flex gap-2">
                          <Textarea
                            value={position.startDate}
                            onChange={(e) => {
                              const newExperience = [...(editedCV.experience || [])]
                              newExperience[index] = { ...position, startDate: e.target.value }
                              handleFieldChange('experience', newExperience)
                            }}
                            placeholder="Start Date"
                            className="w-1/2"
                          />
                          <Textarea
                            value={position.endDate}
                            onChange={(e) => {
                              const newExperience = [...(editedCV.experience || [])]
                              newExperience[index] = { ...position, endDate: e.target.value }
                              handleFieldChange('experience', newExperience)
                            }}
                            placeholder="End Date"
                            className="w-1/2"
                          />
                        </div>
                        {position.location && (
                          <Textarea
                            value={position.location}
                            onChange={(e) => {
                              const newExperience = [...(editedCV.experience || [])]
                              newExperience[index] = { ...position, location: e.target.value }
                              handleFieldChange('experience', newExperience)
                            }}
                            placeholder="Location"
                          />
                        )}
                        <Textarea
                          value={position.description}
                          onChange={(e) => {
                            const newExperience = [...(editedCV.experience || [])]
                            newExperience[index] = { ...position, description: e.target.value }
                            handleFieldChange('experience', newExperience)
                          }}
                          placeholder="Description"
                          rows={4}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    value={editedCV[field] as string}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    rows={field === 'summary' || field === 'skills' ? 4 : 2}
                  />
                )}
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