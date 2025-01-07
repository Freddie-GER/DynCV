'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CVData, Position } from '@/data/base-cv'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import ReactMarkdown from 'react-markdown'

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

type OptimizedSection = string | Position | Position[];

interface PositionAnalysis extends GapAnalysis {
  relevance?: string;
  originalAnalysis?: {
    gaps: string[];
    strengths: string[];
    score: number;
    relevance?: string;
  };
}

interface SectionAnalysisMap {
  [key: string]: PositionAnalysis;
}

export default function OptimizationEditPage() {
  const [currentCV, setCurrentCV] = useState<CVData | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [optimizedSections, setOptimizedSections] = useState<Record<string, OptimizedSection>>({})
  const [showAbortDialog, setShowAbortDialog] = useState(false)
  const [sectionAnalysis, setSectionAnalysis] = useState<SectionAnalysisMap>({})
  const [analyzingSection, setAnalyzingSection] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load data...');
        
        // Get CV from session storage
        const storedCV = sessionStorage.getItem('selectedCV')
        console.log('Stored CV:', storedCV ? 'Found' : 'Not found');
        if (!storedCV) throw new Error('No CV found in session')
        const cvData = JSON.parse(storedCV)
        setCurrentCV(cvData)
        console.log('CV data loaded:', cvData);

        // Load job description from session storage
        const storedJob = sessionStorage.getItem('jobDescription')
        console.log('Stored job description:', storedJob ? 'Found' : 'Not found');
        if (!storedJob) throw new Error('No job description found')

        // First get overall analysis
        const analysisResponse = await fetch('/api/analyze-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: cvData,
            jobDescription: storedJob
          })
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to get analysis')
        }
        const analysisData = await analysisResponse.json()
        setAnalysis(analysisData)

        // Get overall experience analysis
        const experienceResponse = await fetch('/api/analyze-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: cvData,
            jobDescription: storedJob,
            analysisType: 'experience'
          })
        });

        if (!experienceResponse.ok) {
          throw new Error('Failed to get experience analysis')
        }
        const experienceAnalysis = await experienceResponse.json()

        // Set initial greeting message
        const initialMessage = `# Welcome! I've analyzed your CV against the job requirements.

**Overall Match: ${analysisData.overallFit.score}/5**
${analysisData.overallFit.explanation}

### Experience Analysis
**Score: ${experienceAnalysis.experienceAnalysis.score}/5**
${experienceAnalysis.experienceAnalysis.explanation}

${experienceAnalysis.experienceAnalysis.relevantPositions.length > 0 ? `
**Most Relevant Positions:**
${experienceAnalysis.experienceAnalysis.relevantPositions.map((pos: string) => `- ${pos}`).join('\n')}
` : ''}

${experienceAnalysis.experienceAnalysis.transferableSkills.length > 0 ? `
**Transferable Skills:**
${experienceAnalysis.experienceAnalysis.transferableSkills.map((skill: string) => `- ${skill}`).join('\n')}
` : ''}

### Key Areas to Focus On:
${analysisData.suggestedFocus.map((focus: string) => `- ${focus}`).join('\n')}

---
Select a section on the left to start optimizing your CV. I'll help you improve each section to better match the job requirements.`

        setChatMessages([{
          role: 'assistant',
          content: initialMessage
        }])

        // Then get position-specific analyses
        const positionAnalyses = await Promise.all(
          cvData.experience.map(async (position: Position, index: number) => {
            const positionResponse = await fetch('/api/analyze-match', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cv: {
                  summary: '',
                  skills: '',
                  education: '',
                  experience: [position]
                },
                jobDescription: storedJob,
                analyzePositionOnly: true,
                positionIndex: 0
              })
            });

            if (!positionResponse.ok) {
              throw new Error(`Failed to analyze position ${index}`);
            }

            const positionAnalysis = await positionResponse.json();
            return {
              key: `experience_${index}`,
              analysis: {
                ...positionAnalysis.positionAnalysis,
                originalAnalysis: { ...positionAnalysis.positionAnalysis }  // Store the original analysis
              }
            };
          })
        );

        // Store position-specific analyses
        setSectionAnalysis(
          Object.fromEntries(
            positionAnalyses.map(({ key, analysis }) => [key, analysis])
          )
        );
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load required data')
      } finally {
        setLoading(false)
        console.log('Loading completed');
      }
    }

    loadData()
  }, [])

  const handleSectionSelect = (section: string) => {
    setActiveSection(section);
    
    // Get section analysis for regular sections
    const regularSectionAnalysis = analysis?.gapAnalysis[section as keyof typeof analysis.gapAnalysis];
    
    // Handle individual position selection
    if (section.startsWith('experience_')) {
      const positionIndex = parseInt(section.split('_')[1]);
      const positions = currentCV?.experience as Position[];
      
      if (positions && positionIndex >= 0 && positionIndex < positions.length) {
        const position = positions[positionIndex];
        // Get position-specific analysis from sectionAnalysis state
        const positionAnalysis = sectionAnalysis?.[section] as PositionAnalysis | undefined;
        const positionScore = positionAnalysis?.score ?? 0;

        let message = `# Optimizing Position: ${position.title} at ${position.company}

This position has ${positionScore >= 4.5 
  ? "a very good match with the job requirements. Would you like to make any refinements?"
  : positionScore >= 4
  ? "a good match with the job requirements. We could make some improvements to better align with the role."
  : positionScore >= 3
  ? "some relevance to the job requirements. Let's optimize it to better highlight relevant experience and skills."
  : "limited relevance to the job requirements.\n\n**Note:** Since this is a historical position that's not directly relevant to the role, you may want to skip optimizing it to maintain authenticity. If you choose to optimize, we'll focus only on highlighting any transferable skills without altering the core experience."
}

${positionAnalysis?.relevance 
  ? `## Analysis\n${positionAnalysis.relevance}`
  : ''}

---
${positionScore < 3 
  ? "**Recommendation:** Consider skipping this position as it has limited relevance to the target role."
  : "What aspects would you like to focus on improving?"}`

        setChatMessages([
          {
            role: 'assistant',
            content: message
          }
        ]);
        return;
      }
    }

    // Handle regular sections
    if (!regularSectionAnalysis) {
      setChatMessages([
        {
          role: 'assistant',
          content: `There was an error analyzing this section. Please try again later.`
        }
      ]);
      return;
    }

    // If there are no gaps and the score is perfect
    if (regularSectionAnalysis.gaps.length === 0 && regularSectionAnalysis.score === 5) {
      setChatMessages([
        {
          role: 'assistant',
          content: `This section has a perfect match with the job requirements (Score: 5/5) and no identified gaps. Would you still like to make any adjustments?`
        }
      ]);
      return;
    }

    // If score is perfect or near perfect but there might be minor improvements
    if (regularSectionAnalysis.score >= 4.5) {
      const message = regularSectionAnalysis.gaps.length > 0
        ? `This section has an excellent match with the job requirements (Score: ${regularSectionAnalysis.score}/5). There are a few minor points we could address:\n\n${regularSectionAnalysis.gaps.join('\n')}\n\nWould you like to make any adjustments?`
        : `This section has an excellent match with the job requirements (Score: ${regularSectionAnalysis.score}/5). Would you like to make any adjustments to better align with the role?`;

      setChatMessages([
        {
          role: 'assistant',
          content: message
        }
      ]);
      return;
    }

    // If score is very good
    if (regularSectionAnalysis.score >= 4) {
      const message = regularSectionAnalysis.gaps.length > 0
        ? `This section has a very good match with the job requirements (Score: ${regularSectionAnalysis.score}/5). Here are some minor points we could address:\n\n${regularSectionAnalysis.gaps.join('\n')}\n\nWould you like to proceed with optimization?`
        : `This section has a very good match with the job requirements (Score: ${regularSectionAnalysis.score}/5). While major changes aren't necessary, we could make some minor refinements if you'd like. Would you like to proceed with optimization?`;

      setChatMessages([
        {
          role: 'assistant',
          content: message
        }
      ]);
      return;
    }

    // For sections with room for improvement
    const questions = regularSectionAnalysis.questions || [];
    const gaps = regularSectionAnalysis.gaps || [];
    let message = `Let's improve this section (current score: ${regularSectionAnalysis.score}/5).`;
    
    if (gaps.length > 0) {
      message += `\n\nHere are the main points we should address:\n${gaps.join('\n')}`;
    }
    
    if (questions.length > 0) {
      message += `\n\nTo help optimize this section, please answer these questions:\n${questions.join('\n')}`;
    } else {
      message += `\n\nWhat aspects would you like to focus on?`;
    }

    setChatMessages([
      {
        role: 'assistant',
        content: message
      }
    ]);
  };

  const handleSkipSection = (section: string) => {
    setOptimizedSections({
      ...optimizedSections,
      [section]: currentCV![section as keyof CVData] as string
    })
    setActiveSection(null)
    setChatMessages([])
  }

  const updateSectionAnalysis = async (section: string, content: any) => {
    if (!currentCV || !section) return;

    try {
      setAnalyzingSection(section);
      const storedJob = sessionStorage.getItem('jobDescription');
      if (!storedJob) {
        console.error('No job description found');
        return;
      }
      
      // Handle individual position updates
      if (section.startsWith('experience_')) {
        // Create a minimal CV with ONLY this position for analysis
        const position = content as Position;
        const positionCV = {
          summary: '', // Empty other sections to avoid their influence
          skills: '',
          education: '',
          experience: [position] // Only the current position
        };

        // Get position-specific analysis
        const analysisResponse = await fetch('/api/analyze-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: positionCV,
            jobDescription: storedJob,
            isOptimized: true,
            analyzePositionOnly: true, // New flag to indicate we want pure position analysis
            positionIndex: 0
          })
        });

        if (!analysisResponse.ok) throw new Error('Failed to get analysis');
        const newAnalysis = await analysisResponse.json();
        
        // Store the position-specific analysis
        setSectionAnalysis(prev => ({
          ...prev,
          [section]: {
            ...newAnalysis.positionAnalysis, // Expect position-specific analysis from API
            optimized: true
          }
        }));
      } else {
        // Handle regular sections as before
        const tempCV = {
          ...currentCV,
          [section]: content
        };

        const analysisResponse = await fetch('/api/analyze-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: tempCV,
            jobDescription: storedJob,
            isOptimized: true
          })
        });

        if (!analysisResponse.ok) throw new Error('Failed to get analysis');
        const newAnalysis = await analysisResponse.json();
        
        setSectionAnalysis(prev => ({
          ...prev,
          [section]: {
            ...newAnalysis.gapAnalysis[section],
            optimized: true
          }
        }));
      }
    } catch (err) {
      console.error('Failed to update section analysis:', err);
    } finally {
      setAnalyzingSection(null);
    }
  };

  const handleChatSubmit = async () => {
    if (!userInput.trim() || !activeSection) return;

    try {
      // Add user message to chat
      setChatMessages(prev => [...prev, { role: 'user', content: userInput }]);
      setUserInput('');

      // Handle experience section position selection
      if (activeSection === 'experience') {
        const positions = currentCV?.experience as Position[];
        const input = userInput.trim().toLowerCase();

        if (input === 'all') {
          // Optimize all positions
          await handleOptimizeSection();
          return;
        }

        const positionNumber = parseInt(input);
        if (!isNaN(positionNumber) && positionNumber > 0 && positionNumber <= positions.length) {
          const position = positions[positionNumber - 1];
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Let's optimize your position as ${position.title} at ${position.company}. What aspects would you like to focus on?`
          }]);
          return;
        }

        // Invalid input
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Please either type a position number (1-${positions.length}) or "all" to optimize the entire section.`
        }]);
        return;
      }

      // Handle other sections
      await handleOptimizeSection();
    } catch (err) {
      console.error('Failed to handle chat submit:', err);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error. Please try again.'
      }]);
    }
  };

  const handleSave = async () => {
    if (!currentCV) return;

    try {
      setLoading(true);
      const storedJob = sessionStorage.getItem('jobDescription');
      const applicationId = sessionStorage.getItem('currentApplicationId');
      if (!storedJob) throw new Error('No job description found');
      if (!applicationId) throw new Error('No application ID found');

      // Combine optimized positions with the original CV
      const optimizedPositions = Object.entries(optimizedSections)
        .filter(([key]) => key.startsWith('experience_'))
        .map(([key, value]) => ({
          index: parseInt(key.split('_')[1]),
          position: value as Position
        }));

      const updatedExperience = [...(currentCV.experience as Position[])];
      optimizedPositions.forEach(({ index, position }) => {
        if (index >= 0 && index < updatedExperience.length) {
          updatedExperience[index] = position;
        }
      });

      // Create the optimized CV by combining regular sections and updated experience
      const optimizedCV = {
        ...currentCV,
        ...Object.fromEntries(
          Object.entries(optimizedSections)
            .filter(([key]) => !key.startsWith('experience_'))
        ),
        experience: updatedExperience
      };

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
          applicationId,
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

  const handleOptimizedContentChange = (section: string, content: string) => {
    if (section.startsWith('experience_')) {
      try {
        // Try to parse the content as a position
        const lines = content.split('\n');
        const titleLine = lines[0];
        const dateLine = lines[1];
        const locationLine = lines[2];
        const description = lines.slice(4).join('\n');

        const [title, company] = titleLine.split(' at ').map(s => s.trim());
        const [startDate, endDate] = dateLine.split(' - ').map(s => s.trim());
        const location = locationLine.trim();

        const position: Position = {
          title,
          company,
          startDate,
          endDate,
          location: location || undefined,
          description: description.trim()
        };

        setOptimizedSections(prev => ({
          ...prev,
          [section]: position
        }));
      } catch (err) {
        console.error('Failed to parse position content:', err);
        // Keep the raw content if parsing fails
        setOptimizedSections(prev => ({
          ...prev,
          [section]: content
        }));
      }
    } else {
      setOptimizedSections(prev => ({
        ...prev,
        [section]: content
      }));
    }
  };

  const getTextareaValue = (section: string) => {
    const content = optimizedSections[section];
    if (!content) return '';

    if (section.startsWith('experience_')) {
      const position = content as Position;
      if (typeof position === 'object' && 'title' in position) {
        return `${position.title} at ${position.company}\n${position.startDate} - ${position.endDate}\n${position.location || ''}\n\n${position.description}`;
      }
    }

    return String(content);
  };

  const handleSaveSection = async () => {
    if (!activeSection) return;
    
    try {
      // Get analysis for the optimized content
      await updateSectionAnalysis(activeSection, optimizedSections[activeSection]);
      // Close the section
      setActiveSection(null);
      setChatMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze section');
    }
  };

  const handleOptimizeSection = async () => {
    if (!currentCV || !activeSection || optimizing) return;

    try {
      setOptimizing(true);
      const storedJob = sessionStorage.getItem('jobDescription');
      if (!storedJob) throw new Error('No job description found');

      // Handle individual position optimization
      if (activeSection.startsWith('experience_')) {
        const positionIndex = parseInt(activeSection.split('_')[1]);
        const positions = currentCV.experience as Position[];
        
        if (positionIndex >= 0 && positionIndex < positions.length) {
          // Create a CV with only this position for optimization
          const positionCV = {
            ...currentCV,
            experience: [positions[positionIndex]]
          };

          const response = await fetch('/api/optimize-section', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cv: positionCV,
              section: 'experience',
              positionIndex: 0,
              chat: chatMessages,
              jobDescription: storedJob,
              detectLanguage: true, // Flag to detect language from job posting
              addBulletPoints: true,
              positionAnalysis: true,
              formatAsList: true,
              formatInstructions: `
                - Convert the description into bullet points
                - Each bullet point should start with a bullet point character (•)
                - Each point should start with a strong action verb
                - Focus on achievements and responsibilities
                - Keep the professional tone
                - Match the language of the job posting
              `
            })
          });

          if (!response.ok) throw new Error('Failed to optimize position');
          const data = await response.json();

          // Store the optimized position
          setOptimizedSections(prev => ({
            ...prev,
            [activeSection]: {
              ...data.optimizedContent[0],
              description: data.optimizedContent[0].description.trim()
            }
          }));

          // Update chat messages only if we haven't already
          if (!chatMessages.some(msg => msg.content.includes("I've optimized this position"))) {
            setChatMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `I've optimized this position. Here's what I changed:\n\n${data.explanation}\n\nI've formatted the description as bullet points and matched the language of the job posting. Would you like to make any additional adjustments?`
              }
            ]);
          }

          await updateSectionAnalysis(activeSection, data.optimizedContent[0]);
        }
      } else {
        // Handle regular sections (unchanged)
        const response = await fetch('/api/optimize-section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cv: currentCV,
            section: activeSection,
            chat: chatMessages,
            jobDescription: storedJob,
            improveTranslation: true,
            addBulletPoints: true
          })
        });

        if (!response.ok) throw new Error('Failed to optimize section');
        const data = await response.json();

        setOptimizedSections(prev => ({
          ...prev,
          [activeSection]: data.optimizedContent
        }));

        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `I've optimized this section. Here's what I changed:\n\n${data.explanation}\n\nWould you like to make any additional adjustments?`
          }
        ]);

        await updateSectionAnalysis(activeSection, data.optimizedContent);
      }
    } catch (err) {
      console.error('Failed to optimize section:', err);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error while trying to optimize this section. Would you like to try again?'
        }
      ]);
    } finally {
      setOptimizing(false);
    }
  };

  const renderSection = (section: string, data: GapAnalysis) => {
    const optimizedAnalysis = sectionAnalysis[section];
    const hasOptimizedContent = optimizedSections[section];
    const isAnalyzing = analyzingSection === section;

    // Special handling for experience section
    if (section === 'experience' && currentCV?.experience) {
      return (
        <div 
          key={section}
          className="bg-white p-6 rounded-lg shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold capitalize">{section}</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              data.score >= 4 ? 'bg-green-100 text-green-800' :
              data.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Overall Score: {data.score}/5
            </span>
          </div>

          {/* Overall Experience Analysis */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Overall Experience Analysis</h4>
            <div className="space-y-4">
              {data.strengths.length > 0 && (
                <div>
                  <h5 className="font-medium text-green-600">Key Strengths</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {data.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.gaps.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-600">Areas to Address</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {data.gaps.map((gap, i) => (
                      <li key={i} className="text-gray-600">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* List of positions */}
          <div className="space-y-4">
            {(currentCV.experience as Position[]).map((position, index) => {
              const positionKey = `experience_${index}`;
              const isPositionActive = activeSection === positionKey;
              const positionAnalysis = sectionAnalysis[positionKey];
              const hasOptimizedPosition = optimizedSections[positionKey];
              const isAnalyzingPosition = analyzingSection === positionKey;

              return (
                <div 
                  key={positionKey}
                  className={`border rounded-lg transition-colors ${
                    isPositionActive ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  {/* Position Header */}
                  <div 
                    className={`p-4 cursor-pointer flex justify-between items-center ${
                      isPositionActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSectionSelect(positionKey)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`transform transition-transform ${isPositionActive ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <div>
                        <div className="font-medium">{position.title}</div>
                        <div className="text-sm text-gray-600">
                          {position.company} ({position.startDate} - {position.endDate})
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      (hasOptimizedPosition ? positionAnalysis?.score : positionAnalysis?.originalAnalysis?.score ?? 0) >= 4 ? 'bg-green-100 text-green-800' :
                      (hasOptimizedPosition ? positionAnalysis?.score : positionAnalysis?.originalAnalysis?.score ?? 0) >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Score: {(hasOptimizedPosition ? positionAnalysis?.score : positionAnalysis?.originalAnalysis?.score ?? 0)}/5
                    </span>
                  </div>

                  {/* Position Content */}
                  {isPositionActive && (
                    <div className="p-4 border-t border-gray-200">
                      {/* Original Content & Analysis */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">Current Content:</h4>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            (positionAnalysis?.originalAnalysis?.score ?? 0) >= 4 ? 'bg-green-100 text-green-800' :
                            (positionAnalysis?.originalAnalysis?.score ?? 0) >= 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Score: {positionAnalysis?.originalAnalysis?.score ?? 0}/5
                          </span>
                        </div>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-600">
                          <div className="border-l-2 border-gray-200 pl-4">
                            {position.location && (
                              <div className="text-sm mb-2">{position.location}</div>
                            )}
                            <div className="whitespace-pre-wrap">{position.description}</div>
                          </div>
                        </div>
                      </div>

                      {/* Original Gap Analysis */}
                      <div className="space-y-4 mb-4">
                        <div className="border-l-4 border-gray-300 pl-4">
                          <h4 className="font-medium text-gray-700 mb-2">Initial Analysis:</h4>
                          {positionAnalysis?.originalAnalysis && positionAnalysis.originalAnalysis.gaps?.length > 0 && (
                            <div>
                              <h5 className="font-medium text-red-600">Gaps</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {positionAnalysis.originalAnalysis.gaps.map((gap, i) => (
                                  <li key={i} className="text-gray-600">{gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {positionAnalysis?.originalAnalysis && positionAnalysis.originalAnalysis.strengths?.length > 0 && (
                            <div className="mt-2">
                              <h5 className="font-medium text-green-600">Strengths</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {positionAnalysis.originalAnalysis.strengths.map((strength, i) => (
                                  <li key={i} className="text-gray-600">{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {positionAnalysis?.originalAnalysis?.relevance && (
                            <div className="mt-2">
                              <details className="cursor-pointer">
                                <summary className="font-medium text-blue-600 hover:text-blue-700">
                                  Relevance Analysis
                                </summary>
                                <p className="mt-1 text-gray-600 pl-4">{positionAnalysis.originalAnalysis.relevance}</p>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optimized Content & Analysis */}
                      {hasOptimizedPosition && (
                        <>
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-green-700">Optimized Content:</h4>
                              {isAnalyzingPosition ? (
                                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 animate-pulse">
                                  Analyzing...
                                </span>
                              ) : positionAnalysis && (
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  positionAnalysis.score >= 4 ? 'bg-green-100 text-green-800' :
                                  positionAnalysis.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  Score: {positionAnalysis.score}/5
                                </span>
                              )}
                            </div>
                            <div className="mt-2 p-3 bg-green-50 rounded-md text-gray-600">
                              {renderOptimizedPosition(positionKey)}
                            </div>
                          </div>

                          {/* Post-Optimization Analysis */}
                          {positionAnalysis && (
                            <div className="space-y-4 mb-4">
                              <div className="border-l-4 border-green-300 pl-4">
                                <h4 className="font-medium text-green-700 mb-2">After Optimization:</h4>
                                {positionAnalysis.gaps?.length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-red-600">Remaining Gaps</h5>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {positionAnalysis.gaps.map((gap, i) => (
                                        <li key={i} className="text-gray-600">{gap}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {positionAnalysis.strengths?.length > 0 && (
                                  <div className="mt-2">
                                    <h5 className="font-medium text-green-600">Enhanced Strengths</h5>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {positionAnalysis.strengths.map((strength, i) => (
                                        <li key={i} className="text-gray-600">{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {positionAnalysis.relevance && (
                                  <div className="mt-2">
                                    <details className="cursor-pointer">
                                      <summary className="font-medium text-blue-600 hover:text-blue-700">
                                        Updated Relevance Analysis
                                      </summary>
                                      <p className="mt-1 text-gray-600 pl-4">{positionAnalysis.relevance}</p>
                                    </details>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Position Actions */}
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSkipSection(positionKey);
                          }}
                          disabled={isAnalyzingPosition}
                        >
                          Skip Position
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newOptimizedSections = { ...optimizedSections };
                            delete newOptimizedSections[positionKey];
                            setOptimizedSections(newOptimizedSections);
                            handleSectionSelect(positionKey);
                          }}
                          disabled={isAnalyzingPosition}
                        >
                          Start Over
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptimizeSection();
                          }}
                          disabled={isAnalyzingPosition || (positionAnalysis?.originalAnalysis?.score ?? 0) < 2}
                        >
                          {isAnalyzingPosition ? 'Optimizing...' : 'Optimize Position'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Regular section rendering (unchanged)
    return (
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
            Score: {data.score}/5
          </span>
        </div>

        {/* Current Content */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Current Content:</h4>
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-gray-600 whitespace-pre-wrap">
            {section === 'experience' && currentCV?.experience ? (
              <div className="space-y-4">
                {(currentCV.experience as Position[]).map((position, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{position.title}</div>
                        <div>{position.company}</div>
                        {position.location && (
                          <div className="text-sm">{position.location}</div>
                        )}
                      </div>
                      <div className="text-sm">
                        {position.startDate} - {position.endDate}
                      </div>
                    </div>
                    <div className="mt-2 whitespace-pre-wrap">{position.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              String(currentCV![section as keyof CVData])
            )}
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="space-y-4 mb-4">
          {/* Original Analysis */}
          <div className="border-l-4 border-gray-300 pl-4">
            <h4 className="font-medium text-gray-700 mb-2">Analysis:</h4>
            {data.gaps.length > 0 && (
              <div>
                <h5 className="font-medium text-red-600">Gaps</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {data.gaps.map((gap, i) => (
                    <li key={i} className="text-gray-600">{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.strengths.length > 0 && (
              <div className="mt-2">
                <h5 className="font-medium text-green-600">Strengths</h5>
                <ul className="list-disc pl-5 space-y-1">
                  {data.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-600">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Optimized Analysis */}
          {hasOptimizedContent && optimizedAnalysis && (
            <div className="border-l-4 border-green-300 pl-4">
              <h4 className="font-medium text-green-700 mb-2">After Optimization:</h4>
              {optimizedAnalysis.gaps.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-600">Remaining Gaps</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {optimizedAnalysis.gaps.map((gap, i) => (
                      <li key={i} className="text-gray-600">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {optimizedAnalysis.strengths.length > 0 && (
                <div className="mt-2">
                  <h5 className="font-medium text-green-600">Enhanced Strengths</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {optimizedAnalysis.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optimized Content if available */}
        {hasOptimizedContent && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-green-700">Optimized Content:</h4>
              {isAnalyzing ? (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 animate-pulse">
                  Analyzing...
                </span>
              ) : optimizedAnalysis && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  optimizedAnalysis.score >= 4 ? 'bg-green-100 text-green-800' :
                  optimizedAnalysis.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Score: {optimizedAnalysis.score}/5
                </span>
              )}
            </div>
            <div className="mt-2 p-3 bg-green-50 rounded-md text-gray-600 whitespace-pre-wrap">
              {section === 'experience' && Array.isArray(optimizedSections[section]) ? (
                <div className="space-y-4">
                  {(optimizedSections[section] as Position[]).map((position, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{position.title}</div>
                          <div>{position.company}</div>
                          {position.location && (
                            <div className="text-sm">{position.location}</div>
                          )}
                        </div>
                        <div className="text-sm">
                          {position.startDate} - {position.endDate}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap">{position.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                String(optimizedSections[section])
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm text-gray-600">Analyzing changes...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOptimizedPosition = (positionKey: string) => {
    const optimizedPosition = optimizedSections[positionKey] as Position;
    if (!optimizedPosition || typeof optimizedPosition !== 'object') {
      return <div>Invalid optimized content format</div>;
    }

    return (
      <div>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{optimizedPosition.title}</div>
            <div>{optimizedPosition.company}</div>
            {optimizedPosition.location && (
              <div className="text-sm">{optimizedPosition.location}</div>
            )}
          </div>
          <div className="text-sm">
            {optimizedPosition.startDate} - {optimizedPosition.endDate}
          </div>
        </div>
        <div className="mt-2 whitespace-pre-wrap">
          {optimizedPosition.description}
        </div>
      </div>
    );
  };

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
            {Object.entries(analysis.gapAnalysis).map(([section, data]) => renderSection(section, data))}
          </div>
        </div>

        {/* Right Column: Chat & Optimization */}
        <div className="relative">
          {activeSection ? (
            <div className="bg-white p-6 rounded-lg shadow sticky top-4 max-h-[calc(100vh-8rem)] flex flex-col">
              <h2 className="text-2xl font-semibold mb-6">
                {activeSection.startsWith('experience_') ? (
                  <>
                    Optimizing Position: {(() => {
                      const positionIndex = parseInt(activeSection.split('_')[1]);
                      const position = (currentCV.experience as Position[])[positionIndex];
                      return `${position.title} at ${position.company}`;
                    })()}
                  </>
                ) : (
                  `Optimizing ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}`
                )}
              </h2>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 ml-8' 
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={optimizing ? "Optimizing..." : "Type your response..."}
                  disabled={optimizing}
                  className="flex-1"
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={optimizing || !userInput.trim()}
                >
                  {optimizing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Optimizing...</span>
                    </div>
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>

              {/* Optimized Content Editor */}
              {optimizedSections[activeSection] && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Edit Optimized Content</h3>
                  <Textarea
                    value={getTextareaValue(activeSection)}
                    onChange={(e) => handleOptimizedContentChange(activeSection!, e.target.value)}
                    rows={8}
                    className="w-full"
                    placeholder="Edit the optimized content here..."
                  />
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const newOptimizedSections = { ...optimizedSections };
                        delete newOptimizedSections[activeSection!];
                        setOptimizedSections(newOptimizedSections);
                        handleSectionSelect(activeSection!);
                      }}
                      disabled={optimizing}
                    >
                      Start Over
                    </Button>
                    <Button
                      onClick={handleOptimizeSection}
                      disabled={optimizing}
                    >
                      {optimizing ? 'Optimizing...' : 'Optimize Again'}
                    </Button>
                    <Button 
                      onClick={handleSaveSection}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={analyzingSection === activeSection}
                    >
                      {analyzingSection === activeSection ? 'Analyzing...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg text-center sticky top-4">
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