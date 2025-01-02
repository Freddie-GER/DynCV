'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { CVData } from '@/data/base-cv'

interface Props {
  onCVChange: (cv: CVData) => void;
}

export default function CVUpload({ onCVChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setDebugInfo('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Uploading file:', file.name)
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.cvData) {
        throw new Error('No CV data received from server')
      }

      onCVChange(data.cvData)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload')
      setDebugInfo(JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : '',
        type: file.type,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        fullError: err
      }, null, 2))
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
        <p className="text-gray-600 mb-4">
          Upload your CV in PDF format. We'll extract the information and help you review it.
        </p>
        
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Upload CV (PDF)'}
          </Button>
        </div>

        {error && (
          <div className="mt-4">
            <p className="text-red-600">{error}</p>
            {debugInfo && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {debugInfo}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 