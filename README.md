# DynCV - Dynamic CV Enhancer

DynCV is an AI-powered application that helps users optimize their CVs/resumes for specific job applications. This project was started to test the potential of AI to facilitate job matching, especially for people like me who have not been in the job market for a long time and are flabbergasted by the jargon in job postings, not understanding the grade of the match or mismatch.  

Due to time constraints, I abandoned this project some time ago, and is currently in an unfinished state, particularly buggy around the optimization features. ( I have not even begun looking at the export features)

Feel free to fork and play around with it! 

## Current State

The project is functional up to the optimization stage, where users can:
- Upload and store CVs
- Create job applications
- View application history
- Access the optimization interface

However, the optimization features are incomplete and require further development. This makes it a great starting point for developers interested in:
- AI-powered CV optimization
- PDF processing and manipulation
- Job application management systems
- Next.js and TypeScript applications

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (self-hosted or cloud)
- **AI Integration**: OpenAI-compatible LLMs
- **PDF Processing**: pdf-lib, pdfkit, tesseract.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase instance (self-hosted or cloud)
- An OpenAI-compatible LLM API

### Installation

1. Clone the repository:
```bash
git clone https://github.com/freddie-ger/dyncv.git
cd dyncv
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Supabase Configuration (self-hosted or cloud)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LLM Configuration (OpenAI or compatible)
OPENAI_API_KEY=your_llm_api_key
OPENAI_API_BASE_URL=your_llm_base_url  # Optional, for non-OpenAI providers

# Optional: Customize these if needed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
dyncv/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── applications/      # Application management
│   ├── job-matching/      # Job matching features
│   ├── optimization/      # CV optimization features (incomplete)
│   └── auth/              # Authentication
├── components/            # Reusable UI components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## Current Features

1. **CV Management**
   - Upload and store base CVs
   - View CV history
   - Basic PDF processing

2. **Application Tracking**
   - Create and manage job applications
   - Store job descriptions
   - Track application status

3. **User Interface**
   - Modern, responsive design
   - Intuitive navigation
   - Real-time updates

## Areas for Development

The following areas need attention for the project to reach completion:

1. **CV Optimization**
   - Complete the optimization algorithm
   - Implement AI-powered suggestions
   - Add customization options

2. **PDF Generation**
   - Enhance PDF template system
   - Improve formatting options
   - Add export customization

3. **AI Integration**
   - Expand LLM compatibility
   - Improve prompt engineering
   - Add more analysis features

## Contributing

This project is open for contributions! If you're interested in continuing development, here are some ways to help:

1. **Complete the Optimization Features**
   - Implement the core optimization algorithm
   - Add more AI analysis capabilities
   - Improve the user interface

2. **Enhance Existing Features**
   - Improve PDF processing
   - Add more customization options
   - Enhance the application tracking system

3. **Add New Features**
   - Cover letter generation
   - ATS optimization
   - Interview preparation tools

Please feel free to fork the repository as I have no plans to maintain or work on this anywhere in the near future.

## License

This project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

This means you are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original

## Acknowledgments

- The open-source community for their valuable tools and libraries
- All contributors who have helped shape this project
