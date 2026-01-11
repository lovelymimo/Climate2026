# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Climate Safety Hub (기후안전허브) - A citizen-participation platform for flood risk awareness and reporting in Gyeonggi-do, South Korea. The MVP allows citizens to view flood risk on maps and submit reports about flooding/drainage issues.

## Development Commands

All commands run from `frontend/` directory:

```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Start development server (Vite)
npm run build      # TypeScript check + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: react-router-dom v7
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **State**: React Context + useReducer + localStorage persistence
- **Map**: Leaflet + react-leaflet v5

## Architecture

### Frontend Structure (`frontend/src/`)

```
src/
├── App.tsx              # Router configuration
├── main.tsx             # Entry point with AppStoreProvider
├── index.css            # Global styles + Tailwind
├── store/AppStore.tsx   # Global state (Context + Reducer)
├── pages/               # Route components
├── components/          # Reusable UI components
├── hooks/               # Custom hooks (useLocalStorage, useReports)
├── types/               # TypeScript type definitions
└── data/                # Mock data (regions, reports)
```

### Routes

- `/` - Home/splash page
- `/map` - Flood risk map with region selection
- `/region/:regionId` - Region flood info detail
- `/report` - Citizen report submission
- `/report/complete/:reportId` - Report confirmation

### State Management

Global state in `store/AppStore.tsx` uses reducer pattern:
- `SET_REGION` - Update selected region
- `ADD_REPORT` - Submit report (awards 10 points)
- `USE_REWARD` - Redeem reward points

State persists to localStorage under key `climate-safety-hub-mvp`.

### External Data: GeoServer WMS/WFS

`services/wfsService.ts` fetches real flood data from Gyeonggi-do Climate Platform:
- Flood danger index, historical traces, and vulnerable facilities by region
- Environment variables: `VITE_GG_WMS_BASE_URL`, `VITE_GG_API_KEY` (optional, has defaults)

## Design System

Brand colors (from `디자인규칙.md`):
- Primary Green: `#2ECC71` - Main actions, safety indicators
- Primary Blue: `#2980B9` - Headers, links
- Light Blue: `#5DADE2` - Water/flood elements
- Warning Red: `#E74C3C` - High flood risk
- Warning Orange: `#F39C12` - Medium risk
- Dark Gray: `#2C3E50` - Body text

UI follows 8px grid spacing, mobile-first breakpoints: 360px, 768px, 1024px.

## Development Approach

- Frontend-first development; backend comes last
- Use localStorage for data persistence during MVP
- Mock data in `data/` directory for development
- API interfaces prepared but not connected yet
