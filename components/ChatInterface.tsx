'use client'

import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    setMessages(prev => [...prev, { text: input, sender: 'user' }])

    // Here you would typically send the message to your backend for processing
    // For now, we'll just echo the message
    setTimeout(() => {
      setMessages(prev => [...prev, { text: `Echo: ${input}`, sender: 'bot' }])
    }, 1000)

    setInput('')
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Chat Interface</h2>
      <div className="h-64 overflow-y-auto border rounded p-4 mb-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}

