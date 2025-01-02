'use client'

import { useState, useEffect } from 'react'

export default function OptimizationSuggestions() {
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    // Here you would typically fetch optimization suggestions from your backend
    // For now, we'll use mock data
    setSuggestions([
      'Consider highlighting your experience with process optimization in your summary.',
      'Add more details about your experience with AI-based workload reduction.',
      'Emphasize your language skills, especially your fluency in English.'
    ])
  }, [])

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Optimization Suggestions</h2>
      <ul className="list-disc pl-5">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="mb-2">{suggestion}</li>
        ))}
      </ul>
    </div>
  )
}

