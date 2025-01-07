'use client'

import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { CVData, Position } from '@/data/base-cv'

export default function CVForm() {
  const [cvData, setCVData] = useState<CVData>({
    name: '',
    contact: '',
    summary: '',
    skills: '',
    experience: [{
      company: '',
      title: '',
      startDate: '',
      endDate: '',
      description: ''
    }],
    education: '',
    languages: '',
    achievements: '',
    development: '',
    memberships: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCVData(prev => ({ ...prev, [name]: value }))
  }

  const handleExperienceChange = (index: number, field: keyof Position, value: string) => {
    setCVData(prev => {
      const newExperience = [...prev.experience]
      newExperience[index] = { ...newExperience[index], [field]: value }
      return { ...prev, experience: newExperience }
    })
  }

  const addExperience = () => {
    setCVData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }))
  }

  const removeExperience = (index: number) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend or state management solution
    console.log(cvData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" value={cvData.name} onChange={handleChange} placeholder="Name" />
      <Input name="contact" value={cvData.contact} onChange={handleChange} placeholder="Contact Information" />
      <Textarea name="summary" value={cvData.summary} onChange={handleChange} placeholder="Professional Summary" />
      <Textarea name="skills" value={cvData.skills} onChange={handleChange} placeholder="Skills" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Professional Experience</h3>
          <Button type="button" onClick={addExperience} variant="outline">Add Position</Button>
        </div>
        
        {cvData.experience.map((position, index) => (
          <div key={index} className="space-y-2 p-4 border rounded">
            <div className="flex justify-between">
              <h4 className="font-medium">Position {index + 1}</h4>
              {index > 0 && (
                <Button 
                  type="button" 
                  onClick={() => removeExperience(index)}
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
            
            <Input
              value={position.title}
              onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
              placeholder="Job Title"
            />
            <Input
              value={position.company}
              onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
              placeholder="Company"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={position.startDate}
                onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                placeholder="Start Date"
              />
              <Input
                value={position.endDate}
                onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                placeholder="End Date"
              />
            </div>
            <Input
              value={position.location || ''}
              onChange={(e) => handleExperienceChange(index, 'location', e.target.value)}
              placeholder="Location (Optional)"
            />
            <Textarea
              value={position.description}
              onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
              placeholder="Description"
              rows={4}
            />
          </div>
        ))}
      </div>

      <Textarea name="education" value={cvData.education} onChange={handleChange} placeholder="Education" />
      <Input name="languages" value={cvData.languages} onChange={handleChange} placeholder="Languages" />
      <Textarea name="achievements" value={cvData.achievements} onChange={handleChange} placeholder="Achievements" />
      <Textarea name="development" value={cvData.development} onChange={handleChange} placeholder="Continuing Development" />
      <Input name="memberships" value={cvData.memberships} onChange={handleChange} placeholder="Memberships" />
      <Button type="submit">Save CV</Button>
    </form>
  )
}

