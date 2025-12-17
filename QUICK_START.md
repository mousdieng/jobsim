# Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd jobsim-senegal
npm install
```

### 2. Run Development Server
```bash
npm start
```

### 3. Open in Browser
Navigate to `http://localhost:4200/`

## What to Expect

1. **Home Page**: Click "Start Practicing (Sign In)" to authenticate (mock)
2. **Simulations**: Browse 4 different job simulations, filter by category
3. **Jobs Page**: See job listings matched to your completed simulations
4. **Dashboard**: View your portfolio metrics and submission history
5. **Simulation Detail**: Click any simulation to see full details and submit work

## Test the App

- Sign in using the mock authentication (loads mock student user)
- Browse simulations and click "Start Project"
- Fill out the submission form and submit
- Navigate between Simulations, Jobs, and Dashboard using the navbar
- Sign out to return to the home page

## Build for Production

```bash
npm run build
```

Output will be in `dist/jobsim-senegal/`

---

**Note**: This is a fully functional Angular conversion with mock data. All features from the original React app have been preserved!
