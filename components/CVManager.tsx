'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { baseCV, CVData } from '../data/base-cv'

interface Props {
  onCVChange: (cv: CVData) => void;
}

export default function CVManager({ onCVChange }: Props) {
  const [currentCV, setCurrentCV] = useState<CVData>(baseCV);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setDebugInfo('');

    try {
      // Debug Step 1: Initial File Info
      const fileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        webkitRelativePath: file.webkitRelativePath,
        hasArrayBuffer: typeof file.arrayBuffer === 'function',
        hasSlice: typeof file.slice === 'function',
        hasStream: typeof file.stream === 'function'
      };
      console.log('DEBUG Step 1 - File Info:', fileInfo);
      
      // Debug Step 2: File Type Validation
      const fileTypeInfo = {
        originalType: file.type,
        lowerCaseName: file.name.toLowerCase(),
        isPDF: file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf'),
        isJSON: file.type.includes('json') || file.name.toLowerCase().endsWith('.json')
      };
      console.log('DEBUG Step 2 - File Type Info:', fileTypeInfo);

      if (!fileTypeInfo.isPDF && !fileTypeInfo.isJSON) {
        throw new Error(`Invalid file type. Expected PDF or JSON, got: ${file.type}`);
      }

      // Handle PDF files
      if (fileTypeInfo.isPDF) {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Sending PDF to server...');
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        // Debug Step 5: Response Status
        console.log('DEBUG Step 5 - Response status:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Debug Step 6: Response Data
        const data = await response.json();
        console.log('DEBUG Step 6 - Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
        }

        if (!data.cvData) {
          console.log('DEBUG - Missing cvData in response:', data);
          throw new Error('No CV data received from server');
        }

        // Debug Step 7: CV Data Validation
        console.log('DEBUG Step 7 - Validating CV data');
        validateCV(data.cvData);
        
        // Debug Step 8: State Updates
        console.log('DEBUG Step 8 - Updating state with CV data');
        setCurrentCV(data.cvData);
        onCVChange(data.cvData);
      } else {
        // Handle JSON files
        try {
          console.log('DEBUG - Reading JSON file');
          const text = await file.text();
          console.log('DEBUG - Parsing JSON:', text.substring(0, 200) + '...');
          const newCV = JSON.parse(text) as CVData;
          validateCV(newCV);
          setCurrentCV(newCV);
          onCVChange(newCV);
        } catch (jsonError) {
          console.error('DEBUG - JSON parsing error:', jsonError);
          throw new Error(`Invalid JSON file format: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('DEBUG - Final error:', err);
      setError(err instanceof Error ? err.message : 'Error loading CV file');
      setDebugInfo(JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : '',
        type: file.type,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        fullError: err
      }, null, 2));
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateCV = (cv: any) => {
    const requiredFields: (keyof CVData)[] = [
      'name', 'contact', 'summary', 'skills', 'experience',
      'education', 'languages', 'achievements', 'development', 'memberships'
    ];

    // Check if all required fields exist and are strings
    for (const field of requiredFields) {
      if (typeof cv[field] !== 'string') {
        throw new Error(`Invalid format for field: ${field}`);
      }
    }
  };

  const resetToBase = () => {
    setCurrentCV(baseCV);
    onCVChange(baseCV);
  };

  const downloadCurrentCV = () => {
    const blob = new Blob([JSON.stringify(currentCV, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-cv.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">CV Management</h2>
      <div className="flex gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf,application/json,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload CV'}
        </Button>
        <Button onClick={downloadCurrentCV} variant="outline" disabled={loading}>
          Download Current CV
        </Button>
        <Button onClick={resetToBase} variant="outline" disabled={loading}>
          Reset to Base CV
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        <p>Current CV: {currentCV.name}</p>
        {loading && <p className="text-blue-600">Loading CV...</p>}
        {error && (
          <div className="mt-2">
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
  );
} 