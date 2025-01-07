export interface JobAnalysis {
  title: string;
  keyRequirements: Array<{
    text: string;
    type: 'explicit' | 'inferred';
    source?: string;
  }>;
  suggestedSkills: Array<{
    text: string;
    type: 'explicit' | 'inferred';
    source?: string;
  }>;
  culturalFit: string;
  recommendedHighlights: string[];
} 