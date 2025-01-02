'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/test-pdf-gpt', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">PDF Upload Test (with GPT-4o-mini parsing)</h1>
      
      <input 
        type="file" 
        accept=".pdf"
        onChange={handleUpload}
        className="mb-4 block"
      />

      {loading && (
        <div className="mb-4 p-4 bg-blue-100">
          Processing PDF with GPT-4o-mini...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-gray-100">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 