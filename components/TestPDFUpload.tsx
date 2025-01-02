
'use client'

import { useState } from 'react'
import { Button } from './ui/button'

export default function TestPDFUpload() {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const testRoute = async () => {
    try {
      const response = await fetch('/api/test', {
        method: 'POST'
      })
      const data = await response.json()
      setText(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      console.log('Uploading file:', file.name)
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pdf', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.error) {
        setError(data.error)
        setText('')
      } else {
        setError('')
        setText(data.text || JSON.stringify(data, null, 2))
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload')
      setText('')
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={testRoute}>Test Route</Button>

      <input
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      {text && (
        <div className="p-4 bg-gray-50 rounded">
          <pre className="whitespace-pre-wrap text-sm">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
} 