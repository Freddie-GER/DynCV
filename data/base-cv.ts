export interface Position {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description: string;
}

export interface CVData {
  name: string;
  contact: string;
  summary: string;
  skills: string;
  experience: Position[];
  education: string;
  languages: string;
  achievements: string;
  development: string;
  memberships: string;
}

export const baseCV: CVData = {
  name: 'A. Frederike Reppekus',
  contact: 'Erlestraße 91, 45894 Gelsenkirchen | +49 (209) 141496 | afr@reppekus.com | LinkedIN',
  summary: 'Versatile consultant and interim manager with over a decade of experience...',
  skills: 'Business analysis, requirements gathering, stakeholder management...',
  experience: [
    {
      company: 'R2 Brainworks B.V.',
      title: 'Consultant, Managing Partner',
      startDate: '01/2021',
      endDate: 'Present',
      location: 'Amsterdam',
      description: 'Lead consultant responsible for...'
    }
  ],
  education: 'BSP Potsdam | 09/2007 - 06/2011\nB.A. Communications Management...',
  languages: 'German (native), English (fluent), French (basic)',
  achievements: 'Reduced complaint rate by 75% and increased billable cases by average 63% per annum...',
  development: 'Continuous learner with a passion for staying at the forefront of digital innovation...',
  memberships: 'International Institute of Business Analysis (IIBA)'
} 