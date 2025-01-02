'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CVData } from '@/data/base-cv'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface GapAnalysis {
  gaps: string[];
  strengths: string[];
  score: number;
  questions: string[];
}

interface Analysis {
  overallFit: {
    score: number;
    explanation: string;
  };
  seniorityFit: {
    level: string;
    score: number;
    explanation: string;
    concerns: string[];
  };
  gapAnalysis: {
    summary: GapAnalysis;
    skills: GapAnalysis;
    experience: GapAnalysis;
    education: GapAnalysis;
  };
  suggestedFocus: string[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function OptimizationEditPage() {
  const [currentCV, setCurrentCV] = useState<CVData | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [optimizedSections, setOptimizedSections] = useState<Record<string, string>>({})
  const [showAbortDialog, setShowAbortDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current CV
        const cvResponse = await fetch('/api/cv/latest')
        if (!cvResponse.ok) throw new Error('Failed to load CV')
        const cvData = await cvResponse.json()
        setCurrentCV(cvData.cv)

        // Load job description from session storage
        const storedJob = sessionStorage.getItem('jobDescription')
        if (!storedJob) throw new Error('No job description found')

        // Get analysis
        const analysisResponse = await fetch('/api/analyze-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: cvData.cv,
            jobDescription: storedJob
          })
        })

        if (!analysisResponse.ok) throw new Error('Failed to get analysis')
        const analysisData = await analysisResponse.json()
        setAnalysis(analysisData)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load required data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSectionSelect = (section: string) => {
    setActiveSection(section)
    // Initialize chat with questions for this section
    const questions = analysis?.gapAnalysis[section as keyof typeof analysis.gapAnalysis]?.questions || []
    setChatMessages([
      {
        role: 'assistant',
        content: `Let's discuss the gaps in your ${section}. I have some questions that will help me provide better optimization suggestions:\n\n${questions.join('\n')}`
      }
    ])
  }

  const handleSkipSection = (section: string) => {
    setOptimizedSections({
      ...optimizedSections,
      [section]: currentCV![section as keyof CVData] as string
    })
    setActiveSection(null)
    setChatMessages([])
  }

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return

    const newMessages = [
      ...chatMessages,
      { role: 'user', content: userInput } as ChatMessage
    ]

    setChatMessages(newMessages)
    setUserInput('')

    // Get optimization suggestion based on the chat
    try {
      const response = await fetch('/api/optimize-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv: currentCV,
          section: activeSection,
          chat: newMessages
        })
      })

      if (!response.ok) throw new Error('Failed to get optimization suggestion')
      const data = await response.json()

      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: data.explanation }
      ])

      setOptimizedSections({
        ...optimizedSections,
        [activeSection!]: data.optimizedContent
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get optimization suggestion')
    }
  }

  const handleSave = async () => {
    if (!currentCV) return;

    try {
      setLoading(true);
      const storedJob = sessionStorage.getItem('jobDescription');
      if (!storedJob) throw new Error('No job description found');

      const optimizedCV = {
        ...currentCV,
        ...optimizedSections
      }

      // Get new analysis with optimized content
      const newAnalysisResponse = await fetch('/api/analyze-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv: optimizedCV,
          jobDescription: storedJob
        })
      });

      if (!newAnalysisResponse.ok) throw new Error('Failed to get new analysis');
      const newAnalysis = await newAnalysisResponse.json();

      // Save application with new analysis
      const response = await fetch('/api/applications/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseCV: currentCV,
          jobDescription: storedJob,
          optimizedCV,
          analysis: newAnalysis
        })
      });

      if (!response.ok) throw new Error('Failed to save application');
      
      router.push('/applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = () => {
    setShowAbortDialog(true)
  }

  const confirmAbort = () => {
    setShowAbortDialog(false)
    router.push('/optimization')
  }

  if (loading) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">Loading analysis...</div>
      </main>
    )
  }

  if (error || !currentCV || !analysis) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {error || 'Missing required data'}
        </div>
        <Button 
          onClick={() => router.push('/optimization')}
          className="mt-4"
        >
          Back to Analysis
        </Button>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">CV Analysis & Optimization</h1>
      
      {/* Overall Fit Analysis */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Overall Job Fit</h2>
            <p className="text-gray-600 mt-2">{analysis.overallFit.explanation}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">Score:</span>
            <span className={`text-lg font-bold px-3 py-1 rounded-full ${
              analysis.overallFit.score >= 4 ? 'bg-green-100 text-green-800' :
              analysis.overallFit.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {analysis.overallFit.score}/5
            </span>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">Seniority Fit</h3>
            <p className="text-gray-600 mt-2">{analysis.seniorityFit.explanation}</p>
            {analysis.seniorityFit.concerns && analysis.seniorityFit.concerns.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-amber-700">Concerns:</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {analysis.seniorityFit.concerns.map((concern, i) => (
                    <li key={i} className="text-amber-600">{concern}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">{analysis.seniorityFit.level}</span>
              <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                analysis.seniorityFit.score >= 4 ? 'bg-green-100 text-green-800' :
                analysis.seniorityFit.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {analysis.seniorityFit.score}/5
              </span>
            </div>
            {(analysis.seniorityFit.level === 'over-qualified' || analysis.seniorityFit.score <= 2) && (
              <Button
                onClick={handleAbort}
                variant="destructive"
                className="mt-2"
              >
                Abort Application
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column: Section Analysis */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Section Analysis</h2>
          <div className="space-y-6">
            {Object.entries(analysis.gapAnalysis).map(([section, data]) => (
              <div 
                key={section}
                className={`bg-white p-6 rounded-lg shadow cursor-pointer transition-colors ${
                  activeSection === section ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSectionSelect(section)}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold capitalize">{section}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    data.score >= 4 ? 'bg-green-100 text-green-800' :
                    data.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {data.score}/5
                  </span>
                </div>

                {/* Current Content */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700">Current Content:</h4>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-600 whitespace-pre-wrap">
                    {currentCV![section as keyof CVData]}
                  </div>
                </div>

                {/* Optimized Content if available */}
                {optimizedSections[section] && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-700">Optimized Content:</h4>
                    <div className="mt-2 p-3 bg-green-50 rounded-md text-gray-600 whitespace-pre-wrap">
                      {optimizedSections[section]}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {data.gaps.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600">Gaps</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {data.gaps.map((gap, i) => (
                          <li key={i} className="text-gray-600">{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-600">Strengths</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {data.strengths.map((strength, i) => (
                          <li key={i} className="text-gray-600">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSkipSection(section)
                    }}
                  >
                    Skip Optimization
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSectionSelect(section)
                    }}
                  >
                    Optimize Section
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Chat & Optimization */}
        <div>
          {activeSection ? (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-6">
                Optimizing {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h2>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 ml-8' 
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1"
                />
                <Button onClick={handleChatSubmit}>Send</Button>
              </div>

              {/* Optimized Content */}
              {optimizedSections[activeSection] && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Optimized Content</h3>
                  <Textarea
                    value={optimizedSections[activeSection]}
                    onChange={(e) => setOptimizedSections({
                      ...optimizedSections,
                      [activeSection]: e.target.value
                    })}
                    rows={6}
                  />
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={() => {
                        // Remove this section from optimized sections if user wants to start over
                        const newOptimizedSections = { ...optimizedSections };
                        delete newOptimizedSections[activeSection!];
                        setOptimizedSections(newOptimizedSections);
                        // Reset chat
                        handleSectionSelect(activeSection!);
                      }}
                      variant="outline"
                      className="mr-2"
                    >
                      Start Over
                    </Button>
                    <Button 
                      onClick={() => {
                        // Keep the optimization and close the section
                        setActiveSection(null);
                        setChatMessages([]);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Save Section
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              Select a section to start optimization
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading || Object.keys(optimizedSections).length === 0}
        >
          {loading ? 'Saving...' : 'Save Optimizations'}
        </Button>
      </div>

      <Dialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abort Application Process?</DialogTitle>
            <DialogDescription>
              Are you sure you want to abort this application? This action cannot be undone, and any optimizations made will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAbortDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmAbort}
            >
              Yes, Abort Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
} 