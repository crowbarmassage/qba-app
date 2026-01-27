# CLAUDE.md - AI Assistant Guide for QBA Basketball League App

## Project Overview

This is **QBA Basketball League App**, a Progressive Web App (PWA) for managing a recreational basketball league. The app provides schedule viewing, standings tracking, team rosters, Player of the Week voting, and an admin panel.

**Live Site:** https://qba-app.vercel.app
**Version:** 2.0.0

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend framework |
| Vite 5 | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| Supabase | PostgreSQL database + real-time subscriptions |
| React Router 6 | Client-side routing |
| vite-plugin-pwa | PWA capabilities |
| Vercel | Hosting |

## Quick Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Project Structure

```
qba-app/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Main app shell, routing, AppContext
│   ├── supabaseClient.js     # Supabase connection config
│   ├── index.css             # Global styles + Tailwind directives
│   ├── pages/
│   │   ├── Schedule.jsx      # Weekly game schedule (home route)
│   │   ├── Standings.jsx     # League standings table
│   │   ├── Teams.jsx         # All teams list
│   │   ├── TeamDetail.jsx    # Individual team roster
│   │   ├── Vote.jsx          # Player of the Week voting
│   │   ├── Recap.jsx         # Season summary
│   │   └── Admin.jsx         # Admin panel (largest file, ~1000 lines)
│   ├── components/
│   │   ├── GameCard.jsx      # Individual game display with reactions/RSVP
│   │   └── InstallBanner.jsx # PWA install prompt
│   └── hooks/
│       └── useUser.js        # Custom hooks: useUserId, useDarkMode, useIsPWA
├── index.html                # HTML template with PWA meta tags
├── vite.config.js            # Vite + PWA plugin configuration
├── tailwind.config.js        # Tailwind theme (primary colors, animations)
├── postcss.config.js         # PostCSS + Autoprefixer
├── supabase-schema.sql       # Database schema reference
└── .env                      # Environment variables (not in git)
```

## Architecture Patterns

### Global State Management
The app uses React Context (`AppContext`) defined in `App.jsx`:
```javascript
// Access via useApp() hook
const { userId, teams, players, isAdmin, darkMode, toggleDark, isPWA, refreshData } = useApp()
```

### Supabase Client
Imported from `src/supabaseClient.js`:
```javascript
import { supabase } from '../supabaseClient'

// Query pattern
const { data, error } = await supabase.from('tablename').select('*')
```

### Real-time Subscriptions
Used for live updates in Schedule, GameCard, Vote pages:
```javascript
useEffect(() => {
  const channel = supabase
    .channel('channel-name')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tablename' }, callback)
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

### Routing
Routes defined in `App.jsx`:
| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Schedule | Weekly game schedule |
| `/standings` | Standings | League standings |
| `/teams` | Teams | Team list |
| `/teams/:id` | TeamDetail | Individual team |
| `/vote` | Vote | POTW voting |
| `/recap` | Recap | Season summary |
| `/admin` | Admin | Admin panel (PIN protected) |

## Database Schema (Supabase)

### Core Tables
- **teams**: id, name, short_name, color, logo_url, motto
- **players**: id, name, team_id, jersey_number, position, is_captain
- **games**: id, week, home_team_id, away_team_id, game_time, game_date, court, home_score, away_score, game_type, is_complete
- **settings**: key (TEXT PK), value - stores admin_pin, voting_enabled

### Engagement Tables
- **rsvps**: game_id, player_id, status (yes/no/maybe)
- **game_reactions**: game_id, user_id, reaction (emoji)
- **potw_votes**: week, player_id, voter_id
- **potw_winners**: week (unique), player_id, announcement

### RLS Policies
All tables have Row Level Security enabled:
- SELECT: Public on all tables
- INSERT/UPDATE: Public for engagement tables
- DELETE: Public for players only

## Coding Conventions

### File Naming
- Components: PascalCase (`GameCard.jsx`)
- Hooks: camelCase with `use` prefix (`useUser.js`)
- Pages: PascalCase matching route purpose (`Schedule.jsx`)

### Component Structure
```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function ComponentName() {
  const { teams, players } = useApp()
  const [localState, setLocalState] = useState(null)

  useEffect(() => {
    // Data fetching
  }, [])

  return (
    <div className="p-4">
      {/* JSX */}
    </div>
  )
}
```

### Styling Patterns
- Use Tailwind utility classes for all styling
- Custom components defined in `index.css`: `.btn`, `.btn-primary`, `.card`, `.nav-item`, `.week-pill`
- Dark mode: `class` strategy - add `dark:` prefix for dark mode variants
- Mobile-first: Base styles for mobile, use `md:`, `lg:` for larger screens

### LocalStorage Keys
- `mwbl_user_id` - Anonymous user identifier
- `mwbl_dark` - Dark mode preference
- `mwbl_install_dismissed` - PWA banner dismissal
- `qba_admin` - Admin authentication status

## Common Tasks

### Adding a New Page
1. Create `src/pages/NewPage.jsx`
2. Import in `App.jsx`
3. Add route: `<Route path="/newpage" element={<NewPage />} />`
4. Add navigation link if needed

### Adding a New Database Table
1. Create table in Supabase SQL Editor
2. Enable RLS and add appropriate policies
3. Enable real-time if needed (Database > Replication)
4. Query from React: `supabase.from('newtable').select('*')`

### Modifying Game Sorting
Schedule sorting is in `Schedule.jsx` around lines 47-75. Current order: date > time > court.

### Changing Primary Colors
1. Update CSS variables in `src/index.css` (lines ~15-25)
2. Update Tailwind config in `tailwind.config.js`

## Key Files Reference

| File | Lines | Key Functionality |
|------|-------|-------------------|
| `App.jsx` | ~212 | Routing, AppContext, header, navigation |
| `Admin.jsx` | ~1014 | All admin functionality (tabs: Scores, Schedule, Teams, Players, POTW, Settings) |
| `GameCard.jsx` | ~284 | Game display, reactions, RSVP, share |
| `Schedule.jsx` | ~147 | Week selector, game fetching, sorting |
| `Standings.jsx` | ~280 | Standings calculation, tiebreakers |
| `Vote.jsx` | ~282 | POTW voting logic |

## Environment Variables

Required in `.env` file:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

These must also be set in Vercel for production deployment.

## PWA Configuration

PWA is configured in `vite.config.js`:
- Auto-update service worker
- Workbox caching for Supabase API calls (1 hour cache)
- Manifest with theme colors and icons
- Standalone display mode

## Testing Changes

1. Run `npm run dev` for local development
2. Test on mobile using browser dev tools (responsive mode)
3. Test dark mode toggle
4. For admin features, default PIN is stored in `settings` table

## Deployment

The app auto-deploys to Vercel on push to `main` branch:
1. Make changes
2. `git add .`
3. `git commit -m "Description"`
4. `git push`

## Troubleshooting

### Common Issues
- **"Failed to save player"**: Missing RLS INSERT policy on players table
- **Dates showing wrong day**: Use `new Date(date + 'T12:00:00')` for timezone safety
- **Real-time not working**: Check table is in Supabase Replication settings
- **Voting toggle fails**: Ensure `voting_enabled` row exists in settings table

### Debug Steps
1. Check browser console for errors
2. Check Supabase Dashboard > Logs
3. Verify environment variables are set correctly
4. Check RLS policies if data operations fail

## Important Notes for AI Assistants

1. **Read before editing**: Always read relevant files before making changes
2. **Preserve styling**: Use existing Tailwind patterns and custom classes
3. **Context usage**: Use `useApp()` hook for global state, not prop drilling
4. **Supabase patterns**: Follow existing query patterns with error handling
5. **Real-time cleanup**: Always clean up subscriptions in useEffect return
6. **Mobile-first**: Test changes in mobile viewport; app is primarily used on phones
7. **No test files**: This project doesn't have automated tests; verify manually
8. **Admin.jsx is large**: Be careful with edits; it contains multiple tabs and features
9. **LocalStorage naming**: Use `mwbl_` or `qba_` prefix for consistency
10. **Date handling**: Always handle timezone issues carefully when displaying dates
