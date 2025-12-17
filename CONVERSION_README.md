# JobSim Senegal - Angular Conversion

This project is a complete conversion of a Next.js/React application to Angular with TailwindCSS.

## Original Application

The original application was a React/Next.js application featuring:
- Job simulation platform for Senegalese students
- Multiple pages: Home, Simulations List, Simulation Detail, Job Listings, Student Dashboard
- Authentication flow (mock implementation)
- TailwindCSS styling
- Mock data for simulations, jobs, and user submissions

## Conversion Details

### Architecture

The Angular application has been structured as follows:

```
src/app/
├── models/                          # TypeScript interfaces
│   ├── user.model.ts
│   ├── simulation.model.ts
│   ├── submission.model.ts
│   ├── job.model.ts
│   └── index.ts
├── services/                        # Angular services
│   ├── auth.service.ts             # Authentication & user management
│   └── data.service.ts             # Mock data management
├── components/
│   ├── shared/                     # Reusable utility components
│   │   ├── badge/
│   │   ├── status-tag/
│   │   └── asset-icon/
│   └── pages/                      # Page components
│       ├── home/
│       ├── simulations-list/
│       ├── simulation-detail/
│       ├── job-listings/
│       └── student-dashboard/
├── app.ts                          # Main app component
├── app.html                        # Main app template
└── app.config.ts                   # App configuration
```

### Key Conversions

1. **State Management**
   - React `useState` → Angular `signal()`
   - React `useEffect` → Angular `ngOnInit()` lifecycle hook
   - React `useMemo` → Angular `computed()` signals

2. **Component Communication**
   - React props → Angular `@Input()`
   - React callbacks → Angular `@Output()` with EventEmitter

3. **Reactivity**
   - React hooks → Angular Observables (RxJS) and Signals
   - BehaviorSubject for state management in services

4. **Styling**
   - TailwindCSS v4 with `@tailwindcss/postcss`
   - All utility classes preserved from original

5. **Routing**
   - React conditional rendering → Angular view state management with signals
   - Navigation handled via component method calls

## Running the Application

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
cd jobsim-senegal
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## Features

- ✅ Home page with hero section and CTAs
- ✅ Job simulations listing with filtering by category
- ✅ Detailed simulation view with brief, deliverables, and submission form
- ✅ Job listings page showing skill matches
- ✅ Student dashboard with metrics and submission history
- ✅ Mock authentication system
- ✅ Responsive design with TailwindCSS
- ✅ All utility components (Badge, StatusTag, AssetIcon)

## Tech Stack

- **Framework**: Angular 20
- **Styling**: TailwindCSS v4
- **Build Tool**: Angular CLI with esbuild
- **Language**: TypeScript
- **State Management**: Angular Signals + RxJS
- **Forms**: Angular Forms (FormsModule)

## Project Structure Highlights

### Services

**AuthService**: Manages user authentication state with mock sign-in
- Uses BehaviorSubject for reactive state
- Provides observables for authentication status

**DataService**: Provides mock data for simulations, jobs, and submissions
- Centralizes all application data
- Uses BehaviorSubject for submissions to allow updates

### Components

All components are standalone (not requiring NgModule declarations).

**Shared Components**:
- Badge: Displays achievement badges
- StatusTag: Shows simulation progress status
- AssetIcon: Renders different file type icons

**Page Components**:
- Home: Landing page with sign-in/sign-up
- SimulationsList: Filterable grid of job simulations
- SimulationDetail: Full simulation brief with submission form
- JobListings: Matches jobs to completed simulations
- StudentDashboard: User metrics and submission history

## Conversion Challenges Solved

1. **Pipes in Event Handlers**: Angular doesn't allow pipes in event handlers, solved by creating a `navigateHome()` method
2. **TailwindCSS v4**: Updated to use new `@import "tailwindcss"` syntax
3. **Date Handling**: Created `currentDate` property instead of using `Date.now()` in template
4. **Standalone Components**: All components use Angular's standalone API

## Future Enhancements

- Real authentication with Firebase or backend API
- Actual file upload functionality
- Real-time mentor feedback system
- Database integration for persistence
- Unit and integration tests
- Routing with Angular Router for proper URLs

## License

Same as original project.
