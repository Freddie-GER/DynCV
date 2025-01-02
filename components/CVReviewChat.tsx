'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CVData } from '@/data/base-cv'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  cv: CVData
  onUpdate: (cv: CVData) => void
  onProceed: () => void
  loading?: boolean
}

export default function CVReviewChat({ cv, onUpdate, onProceed, loading: parentLoading = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Combined loading state
  const isLoading = loading || parentLoading

  // Start the conversation when component mounts or CV changes
  useEffect(() => {
    handleInitialReview()
  }, [cv]) // Re-run when CV changes

  const handleInitialReview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful CV review assistant. Review the CV and ask about accuracy and currency of information.'
            },
            {
              role: 'user',
              content: `Please review this CV and help me verify its information:
              
${JSON.stringify(cv, null, 2)}

Start by:
1. Asking if all information is accurate
2. Checking if any experiences need updating
3. Suggesting any missing information`
            }
          ],
          cv: cv // Pass the current CV state
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setMessages([
        {
          role: 'assistant',
          content: data.message
        }
      ])
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful CV review assistant. Help update and improve the CV based on the conversation.'
            },
            ...messages,
            { role: 'user', content: userMessage }
          ],
          cv: cv // Pass the current CV state
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      
      // If CV updates were suggested, apply them
      if (data.updatedCV) {
        onUpdate(data.updatedCV)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Review & Update</h2>

      {/* Chat messages */}
      <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'assistant' 
                ? 'bg-blue-50 ml-4' 
                : 'bg-gray-50 mr-4'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="p-4 bg-blue-50 ml-4 rounded-lg animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleInitialReview}
          disabled={isLoading}
        >
          Restart Review
        </Button>
        <Button 
          onClick={onProceed}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
} 