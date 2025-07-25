# My Genius Profile

A Next.js web application that helps parents and children build strength-based profiles to share with teachers, aiming to inspire more personalized learning experiences.

## Features

- **Interactive Chatbot Wizard**: Guided conversation flow to collect information about children's strengths, interests, and learning preferences
- **Real-time Profile Preview**: Live preview of the generated profile as users answer questions
- **Authentication**: Firebase Auth integration for user accounts and progress saving
- **Progress Persistence**: Automatic saving of conversation progress using Firebase Firestore (for logged-in users) or localStorage (for anonymous users)
- **AI-Powered Summaries**: LLM-generated summaries for each conversation module
- **Email Summary**: Send complete profile summaries to user's email
- **Resource Matching**: Local community resources matched to children's profiles (planned feature)

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **AI/LLM**: Claude API (via Netlify Functions)
- **Email**: Resend (via Netlify Functions)
- **Deployment**: Netlify
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Auth and Firestore enabled
- Claude API key
- Resend API key

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Netlify Environment Variables (for production)
CLAUDE_API_KEY=your_claude_api_key
RESEND_API_KEY=your_resend_api_key
SECRETS_SCAN_OMIT_KEYS=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── chatbot/           # Chatbot wizard and profile preview
│   ├── layout.tsx         # Root layout with footer
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── AuthButton.tsx     # Firebase authentication UI
│   └── ModuleProgressBar.tsx # Progress bar for conversation modules
├── hooks/                 # Custom React hooks
│   ├── ModuleSummariesContext.tsx # Context for sharing summary state
│   └── useProfileProgress.ts # Progress management hook
├── lib/                   # Library configurations
│   └── firebase.ts        # Firebase initialization
├── services/              # API and external service integrations
│   ├── email.ts           # Email service interface
│   └── firestore.ts       # Firestore database operations
└── types/                 # TypeScript type definitions

netlify/
└── functions/             # Serverless functions
    ├── generate-summary.ts # LLM summary generation
    └── send-summary.ts     # Email sending

public/
├── conversationFlow.json  # Chatbot conversation configuration
├── improved_results.json  # Mock resource data
└── terms-and-conditions.pdf
```

## Key Components and Hooks

### useProfileProgress Hook

The `useProfileProgress` hook is the central state management solution for user progress throughout the application. It provides:

- **Automatic progress loading** from Firestore (for logged-in users) or localStorage (for anonymous users)
- **Progress saving** with automatic persistence
- **User authentication state** management
- **Loading and error states** for better UX

```typescript
import { useProfileProgress } from "@/hooks/useProfileProgress";

function MyComponent() {
  const { progress, save, user, loading, error, reset } = useProfileProgress();
  
  // progress: Current user progress data
  // save: Function to save progress
  // user: Current authenticated user
  // loading: Loading state
  // error: Error state
  // reset: Function to reset progress
}
```

**Usage Guidelines:**
- Use this hook in any component that needs access to user progress
- The hook automatically handles authentication state changes
- Progress is automatically saved when the `save` function is called
- For logged-in users, progress is saved to Firestore; for anonymous users, it's saved to localStorage

### ModuleSummariesContext

Provides shared state for AI-generated summaries across components:

```typescript
import { useModuleSummaries } from "@/hooks/ModuleSummariesContext";

function MyComponent() {
  const { summaries, generateSummary, getModuleSummary } = useModuleSummaries();
}
```

## Resource Matching Web Crawler (Scrapy)

The project includes a Python-powered web crawler built with [Scrapy](https://scrapy.org/) to collect local K-8 educational and community resources for future resource matching features.

- **Location:** `resource-scraper/`
- **Framework:** Scrapy (Python)
- **Purpose:** Gathers data on local community resources, cultural organizations, tutoring services, and mentorship programs to match with user profiles.
- **Output:** Scraped data is saved as JSON (e.g., `public/improved_results.json`) for use in the frontend.

### Current Stage
- The Scrapy crawler is set up and successfully scraping data from a curated list of target resource websites (e.g., libraries, community centers, etc.).
- The output is being used as a mock dataset in the frontend (`public/improved_results.json`).
- The crawler avoids Google search results due to `robots.txt` restrictions and focuses on directly scraping known resource sites.

### Next Steps
- Expand the list of target websites to increase resource coverage, especially for local and culturally relevant organizations.
- Refine data extraction logic to improve consistency and completeness (e.g., ensure all fields like name, description, location, contact info, and cost are captured).
- Plan and implement integration with a PostgreSQL/Neon database for scalable resource storage and querying.
- Develop a matching algorithm to connect user profiles with relevant resources.
- Add automated or manual review steps to ensure data quality and relevance.

### Basic Usage

1. Install Python dependencies:
   ```bash
   cd resource-scraper
   pip install -r requirements.txt
   ```
2. Run the spider:
   ```bash
   scrapy crawl community_resources -o output.json
   ```
3. Copy the output file (e.g., `output.json`) to `public/improved_results.json` for frontend use.

See `resource-scraper/README.md` for more details and customization options.

## Firebase Configuration

### Firestore Security Rules

Set up these rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Authentication

The app supports:
- Email/password registration and login
- Password reset functionality
- Anonymous usage (progress saved to localStorage)

## Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Build Configuration

The project uses a custom `netlify.toml` configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow React functional component patterns with hooks
- Use custom hooks for complex state management
- Implement proper error handling and loading states

### State Management

- Use the `useProfileProgress` hook for all progress-related state
- Use React Context for shared state across components
- Keep state as close to usage as possible
- Avoid prop drilling by using context or custom hooks

### Testing

- Use React Testing Library for component tests
- Test user interactions and behavior, not implementation details
- Mock external services (Firebase, API calls) in tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the development guidelines
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]
