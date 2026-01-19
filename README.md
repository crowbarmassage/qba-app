# QBA Basketball League App

A Progressive Web App (PWA) for managing a recreational basketball league. Built with React, Tailwind CSS, and Supabase.

**Live Site:** https://qba-app.vercel.app

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Frontend Files](#frontend-files)
5. [Backend (Supabase)](#backend-supabase)
6. [Common Customizations](#common-customizations)
7. [Local Development](#local-development)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Features
- **Schedule** — View weekly game schedules with dates, times, and courts
- **Standings** — Auto-calculated from game results
- **Teams** — Team rosters with player details
- **Voting** — Player of the Week voting (can be toggled on/off by admin)
- **Reactions** — Post-game emoji reactions
- **RSVP** — "Who's coming?" for upcoming games
- **Admin Panel** — Enter scores, edit schedule, manage teams/players, change PIN
- **PWA** — Installable on phones, works offline for cached content
- **Dark Mode** — Toggle between light and dark themes
- **Real-time Updates** — Changes sync instantly via Supabase

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Real-time | Supabase Realtime subscriptions |

---

## Project Structure

```
qba-app/
├── public/                  # Static assets (icons, manifest)
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GameCard.jsx     # Individual game display card
│   │   └── InstallBanner.jsx # PWA install prompt
│   ├── hooks/               # Custom React hooks
│   │   └── useUser.js       # User ID, dark mode, PWA detection
│   ├── pages/               # Route pages
│   │   ├── Admin.jsx        # Admin panel (scores, teams, players, settings)
│   │   ├── Recap.jsx        # Season recap/summary
│   │   ├── Schedule.jsx     # Weekly game schedule
│   │   ├── Standings.jsx    # League standings table
│   │   ├── TeamDetail.jsx   # Individual team page
│   │   ├── Teams.jsx        # All teams list
│   │   └── Vote.jsx         # Player of the Week voting
│   ├── App.jsx              # Main app component, routing, context
│   ├── index.css            # Global styles + Tailwind
│   ├── main.jsx             # React entry point
│   └── supabaseClient.js    # Supabase connection config
├── .env                     # Environment variables (not in git)
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite build configuration
└── supabase-schema.sql      # Database schema (reference)
```

---

## Frontend Files

### Core Files

#### `src/App.jsx`
**Purpose:** Main application shell, routing, and global state

**Key sections:**
- **Lines 1-20:** Imports and context setup
- **Lines 22-50:** Global state (teams, players, admin status)
- **Lines 52-74:** Admin login/logout handlers
- **Lines 76-85:** Context provider values
- **Lines 86-200:** Header, navigation, routing

**Common edits:**
| Task | Location |
|------|----------|
| Change app name | Line ~92: `<h1>QBA</h1>` |
| Add new route | Lines ~150-170: Add `<Route>` component |
| Add to navigation | Lines ~175-195: Add `<NavLink>` |
| Modify global state | Lines ~76-85: Add to `ctx` object |

---

#### `src/supabaseClient.js`
**Purpose:** Supabase connection configuration

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Note:** Never edit this file directly. Set credentials in `.env` file.

---

#### `src/index.css`
**Purpose:** Global styles and Tailwind imports

**Key sections:**
- **Lines 1-10:** Tailwind directives
- **Lines 12-50:** CSS variables (colors)
- **Lines 52-100:** Custom component classes (`.card`, `.btn-primary`, etc.)
- **Lines 100+:** Utility classes and animations

**Common edits:**
| Task | Location |
|------|----------|
| Change primary color | Lines ~15-20: CSS variables `--primary-*` |
| Modify button styles | Lines ~60-80: `.btn-primary`, `.btn-secondary` |
| Add custom animations | End of file |

---

### Pages

#### `src/pages/Schedule.jsx`
**Purpose:** Display weekly game schedule

**Key sections:**
- **Lines 1-10:** Imports and state
- **Lines 12-45:** Data loading and real-time subscription
- **Lines 47-75:** Game sorting logic (date → time → court)
- **Lines 77-120:** UI rendering

**Common edits:**
| Task | Location |
|------|----------|
| Change week labels | Lines ~49-54: `weekLabel()` function |
| Modify sort order | Lines ~51-75: `weekGames.sort()` |
| Add playoff info | Lines ~104-115: Playoff format section |

---

#### `src/pages/Standings.jsx`
**Purpose:** Display league standings table

**Key sections:**
- **Lines 1-30:** State and data fetching
- **Lines 32-80:** Standings calculation from games
- **Lines 82-150:** Table UI rendering

**Common edits:**
| Task | Location |
|------|----------|
| Change tiebreaker logic | Lines ~60-75: Sort function |
| Add/remove columns | Lines ~100-140: Table columns |
| Modify playoff line | Lines ~85-95: Playoff cutoff indicator |

---

#### `src/pages/Teams.jsx`
**Purpose:** List all teams

**Common edits:**
| Task | Location |
|------|----------|
| Change team card layout | Main return JSX |
| Add team stats | Fetch additional data in useEffect |

---

#### `src/pages/TeamDetail.jsx`
**Purpose:** Individual team page with roster

**Common edits:**
| Task | Location |
|------|----------|
| Modify player display | Player list section |
| Add team stats | Fetch and display additional stats |

---

#### `src/pages/Vote.jsx`
**Purpose:** Player of the Week voting

**Key sections:**
- **Lines 1-25:** State and voting enabled check
- **Lines 27-70:** Vote loading and submission
- **Lines 72-150:** Voting UI

**Common edits:**
| Task | Location |
|------|----------|
| Change voting rules | Lines ~60-70: Vote submission logic |
| Modify disabled message | Lines ~118-130: Voting disabled UI |

---

#### `src/pages/Admin.jsx`
**Purpose:** Admin panel for league management

**Key sections:**
- **Lines 1-50:** State variables for all tabs
- **Lines 52-100:** Data loading functions
- **Lines 102-200:** Save/update functions (scores, teams, players)
- **Lines 202-250:** PIN change and voting toggle functions
- **Lines 252-350:** Tabs UI and navigation
- **Lines 352-500:** Scores tab
- **Lines 502-600:** Schedule tab
- **Lines 602-700:** Teams tab
- **Lines 702-850:** Players tab
- **Lines 852-920:** POTW tab
- **Lines 922-1000:** Settings tab

**Common edits:**
| Task | Location |
|------|----------|
| Add new admin tab | Lines ~252-260: Add to tabs array |
| Modify score entry | Lines ~352-450: Scores tab section |
| Change default PIN | Supabase `settings` table, not code |
| Add new setting | Lines ~922-1000: Settings tab + new state |

---

#### `src/pages/Recap.jsx`
**Purpose:** End-of-season summary

**Common edits:**
| Task | Location |
|------|----------|
| Modify recap stats | Stats calculation section |
| Change layout | Main return JSX |

---

### Components

#### `src/components/GameCard.jsx`
**Purpose:** Individual game display with reactions and RSVP

**Key sections:**
- **Lines 1-25:** State and team lookup
- **Lines 27-75:** Reactions fetching and handling
- **Lines 77-120:** RSVP fetching
- **Lines 122-150:** Share functionality
- **Lines 152-200:** Game type badges and counts
- **Lines 202-285:** Card UI rendering

**Common edits:**
| Task | Location |
|------|----------|
| Change available reactions | Line ~5: `REACTIONS` array |
| Modify share text | Lines ~100-105: `handleShare()` |
| Change date/time format | Lines ~176-182: Date display |
| Add new game info | Lines ~174-192: Game details section |

---

#### `src/components/InstallBanner.jsx`
**Purpose:** PWA install prompt banner

**Common edits:**
| Task | Location |
|------|----------|
| Change install message | Banner text content |
| Modify dismiss behavior | Dismiss handler |

---

### Hooks

#### `src/hooks/useUser.js`
**Purpose:** Custom hooks for user state

**Exports:**
- `useUserId()` — Returns unique user ID (stored in localStorage)
- `useDarkMode()` — Returns `[darkMode, toggleDark]`
- `useIsPWA()` — Returns true if running as installed PWA

**Common edits:**
| Task | Location |
|------|----------|
| Change localStorage keys | Key strings in each hook |
| Add new user preference | Create new hook following same pattern |

---

## Backend (Supabase)

### Database Tables

Access via Supabase Dashboard → Table Editor

#### `teams`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Full team name |
| short_name | TEXT | 3-letter abbreviation |
| color | TEXT | Hex color code |
| motto | TEXT | Team slogan (optional) |

**Admin edit:** Admin Panel → Teams tab

---

#### `players`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | TEXT | Player name |
| team_id | INTEGER | Foreign key to teams |
| jersey_number | INTEGER | Jersey number |
| position | TEXT | guard/forward/center |
| is_captain | BOOLEAN | Team captain flag |

**Admin edit:** Admin Panel → Players tab

---

#### `games`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| week | INTEGER | Week number (1-9) |
| home_team_id | INTEGER | Foreign key to teams |
| away_team_id | INTEGER | Foreign key to teams |
| home_team | TEXT | Home team name (denormalized) |
| away_team | TEXT | Away team name (denormalized) |
| game_time | TEXT | Time string (e.g., "6:00 PM") |
| game_date | DATE | Game date |
| court | INTEGER | Court number |
| home_score | INTEGER | Home team score |
| away_score | INTEGER | Away team score |
| game_type | TEXT | regular/playin/semifinal/final/third_place |
| is_complete | BOOLEAN | Auto-set when scores entered |

**Admin edit:** Admin Panel → Scores tab (scores), Times tab (schedule)

---

#### `settings`
| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Setting name (primary key) |
| value | TEXT | Setting value |

**Current settings:**
- `admin_pin` — Admin login PIN
- `voting_enabled` — "true" or "false"

**Admin edit:** Admin Panel → Settings tab

---

#### `rsvps`
| Column | Type | Description |
|--------|------|-------------|
| game_id | INTEGER | Foreign key to games |
| player_id | INTEGER | Foreign key to players |
| status | TEXT | yes/no/maybe |

---

#### `game_reactions`
| Column | Type | Description |
|--------|------|-------------|
| game_id | INTEGER | Foreign key to games |
| user_id | TEXT | Anonymous user ID |
| reaction | TEXT | Emoji reaction |

---

#### `potw_votes`
| Column | Type | Description |
|--------|------|-------------|
| week | INTEGER | Week number |
| player_id | INTEGER | Foreign key to players |
| voter_id | TEXT | Anonymous user ID |

---

#### `potw_winners`
| Column | Type | Description |
|--------|------|-------------|
| week | INTEGER | Week number (unique) |
| player_id | INTEGER | Foreign key to players |
| announcement | TEXT | Optional announcement text |

**Admin edit:** Admin Panel → POTW tab

---

### Row Level Security (RLS)

All tables have RLS enabled with these policies:
- **SELECT:** Public (anyone can read)
- **INSERT:** Public for engagement tables (rsvps, reactions, votes)
- **UPDATE:** Public for games, rsvps, reactions, settings
- **DELETE:** Public for players only

To modify policies: Supabase Dashboard → Authentication → Policies

---

### Real-time Subscriptions

These tables have real-time enabled:
- `games` — Score updates
- `rsvps` — RSVP changes
- `game_reactions` — Reaction updates
- `potw_votes` — Vote updates

To enable/disable: Supabase Dashboard → Database → Replication

---

## Common Customizations

### Change League Name
1. `src/App.jsx` line ~92: Change `<h1>QBA</h1>`
2. `src/components/GameCard.jsx` lines ~102-103: Change `#QBA` in share text
3. `index.html` line ~5: Change `<title>`

### Change Primary Color
1. `src/index.css` lines ~15-25: Update CSS variables
2. `tailwind.config.js`: Update primary color palette

### Add a New Page
1. Create `src/pages/NewPage.jsx`
2. Import in `src/App.jsx`
3. Add `<Route path="/newpage" element={<NewPage />} />` in routes
4. Add `<NavLink to="/newpage">` in navigation

### Add a New Database Table
1. Create table in Supabase SQL Editor
2. Enable RLS and add policies
3. (Optional) Enable real-time in Replication settings
4. Query from React using `supabase.from('tablename').select()`

### Change Admin PIN
1. Go to Admin Panel → Settings tab
2. Enter current PIN, new PIN, confirm
3. Or directly in Supabase: `UPDATE settings SET value = 'newpin' WHERE key = 'admin_pin'`

---

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Setup
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/qba-app.git
cd qba-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (http://localhost:5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Auto-deploy
Vercel auto-deploys on every push to `main` branch.

### Manual Deploy
```bash
git add .
git commit -m "Your changes"
git push
```

---

## Troubleshooting

### "Failed to save player" error
**Cause:** Missing RLS INSERT policy on players table
**Fix:** Run in Supabase SQL Editor:
```sql
CREATE POLICY "Public insert players" ON players FOR INSERT WITH CHECK (true);
```

### Team names not updating everywhere
**Cause:** Global context not refreshing
**Fix:** Ensure `refreshData()` is called after team updates in Admin.jsx

### Dates showing wrong day
**Cause:** Timezone conversion issue
**Fix:** Use `new Date(date + 'T12:00:00')` instead of `new Date(date)`

### Voting toggle not working
**Cause:** Missing settings row or policy
**Fix:** Run in Supabase SQL Editor:
```sql
INSERT INTO settings (key, value) VALUES ('voting_enabled', 'true') ON CONFLICT DO NOTHING;
CREATE POLICY "Public insert settings" ON settings FOR INSERT WITH CHECK (true);
```

### Real-time updates not working
**Cause:** Table not in replication
**Fix:** Supabase Dashboard → Database → Replication → Add table

---

## Support

For issues or questions:
1. Check this README
2. Review Supabase logs (Dashboard → Logs)
3. Check browser console for errors
4. Review Vercel deployment logs

---

*Last updated: January 2025*
