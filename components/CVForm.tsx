'use client'

import { useState } from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'

export default function CVForm() {
  const [cvData, setCVData] = useState({
    name: '',
    contact: '',
    summary: '',
    skills: '',
    experience: '',
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
      <Textarea name="experience" value={cvData.experience} onChange={handleChange} placeholder="Professional Experience" />
      <Textarea name="education" value={cvData.education} onChange={handleChange} placeholder="Education" />
      <Input name="languages" value={cvData.languages} onChange={handleChange} placeholder="Languages" />
      <Textarea name="achievements" value={cvData.achievements} onChange={handleChange} placeholder="Achievements" />
      <Textarea name="development" value={cvData.development} onChange={handleChange} placeholder="Continuing Development" />
      <Input name="memberships" value={cvData.memberships} onChange={handleChange} placeholder="Memberships" />
      <Button type="submit">Save CV</Button>
    </form>
  )
}

