# Quick Start: Export to Cursor

## Method 1: Direct Export (Recommended)

1. **Look for the Download/Export button** in Figma Make interface (usually top-right)
2. Click it to download a ZIP file
3. Extract the ZIP file to your desired location
4. Open in Cursor:
   ```bash
   cd path/to/extracted-folder
   cursor .
   ```

## Method 2: Manual Setup in Cursor

If no export button exists:

### Step 1: Create New Vite Project
```bash
# Create new directory
mkdir game-show-app
cd game-show-app

# Initialize Vite with React + TypeScript
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
```

### Step 2: Install Required Packages
```bash
# Core dependencies
npm install lucide-react motion recharts react-slick
npm install react-dnd react-dnd-html5-backend
npm install react-hook-form@7.55.0

# Radix UI components
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog
npm install @radix-ui/react-avatar @radix-ui/react-checkbox
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-popover
npm install @radix-ui/react-progress @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider
npm install @radix-ui/react-slot @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-tooltip

# Utilities
npm install class-variance-authority clsx tailwind-merge

# Tailwind CSS v4
npm install -D tailwindcss@4 @tailwindcss/vite
```

### Step 3: Configure Vite
Create/update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 4: Copy Files from Figma Make
Copy these files/folders to your new project:

```
src/
├── app/
│   ├── App.tsx
│   ├── types/
│   │   └── game.ts
│   └── components/
│       ├── GameSetup.tsx
│       ├── GameController.tsx
│       ├── Scoreboard.tsx
│       ├── PlayerMode.tsx
│       ├── player/
│       │   ├── PlayerJoin.tsx
│       │   ├── PlayerView.tsx
│       │   └── HostGameCode.tsx
│       ├── rounds/
│       │   ├── TriviaBuzz.tsx
│       │   ├── LightningRound.tsx
│       │   ├── QuickBuild.tsx
│       │   ├── Connect4.tsx
│       │   ├── GuessNumber.tsx
│       │   └── BlindDraw.tsx
│       └── ui/
│           └── (all UI components)
├── styles/
│   ├── theme.css
│   └── fonts.css
└── index.css
```

### Step 5: Update main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 6: Test Locally
```bash
npm run dev
```

## Adding Backend (Supabase)

### Step 1: Install Supabase
```bash
npm install @supabase/supabase-js
```

### Step 2: Create Supabase Project
1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project
4. Wait for project to initialize (~2 minutes)

### Step 3: Get Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - Project URL
   - `anon` `public` key

### Step 4: Add Environment Variables
Create `.env.local` in root:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy contents from `database-schema.sql` file
3. Paste and click **Run**

### Step 6: Create Service Files
Create these files in your project:

**src/services/supabase.ts** - See BACKEND_INTEGRATION.md
**src/services/gameService.ts** - See BACKEND_INTEGRATION.md
**src/services/buzzService.ts** - See BACKEND_INTEGRATION.md
**src/hooks/useGameSync.ts** - See BACKEND_INTEGRATION.md

### Step 7: Update Components
Ask Cursor AI to help:
```
"Integrate Supabase real-time sync into GameController.tsx using the 
useGameSync hook from /src/hooks/useGameSync.ts"
```

## Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

## File Structure After Export

```
game-show-app/
├── node_modules/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── types/
│   │   └── components/
│   ├── services/          # ← Add for backend
│   │   ├── supabase.ts
│   │   ├── gameService.ts
│   │   └── buzzService.ts
│   ├── hooks/             # ← Add for backend
│   │   └── useGameSync.ts
│   ├── styles/
│   └── index.css
├── .env.local             # ← Add for backend
├── database-schema.sql    # ← From this export
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Testing Multi-Device

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Get local IP:**
   ```bash
   # Check terminal output for "Network: http://192.168.x.x:5173"
   ```

3. **Test on multiple devices:**
   - Computer: `http://localhost:5173` (Host Mode)
   - Phone 1: `http://192.168.x.x:5173` (Player Mode)
   - Phone 2: `http://192.168.x.x:5173` (Player Mode)

4. **All join same game code** → Should sync in real-time!

## Troubleshooting

**Issue: Import errors**
```bash
# Make sure @ alias is configured in vite.config.ts
# and tsconfig.json has path mapping
```

**Issue: Styles not working**
```bash
# Ensure Tailwind is imported in index.css
# Check that @tailwindcss/vite is in plugins
```

**Issue: Supabase connection fails**
```bash
# Check .env.local exists and has correct values
# Restart dev server after adding env variables
```

## Next Steps

1. ✅ Export code to Cursor
2. ✅ Set up local environment
3. ✅ Test game locally
4. ⬜ Set up Supabase
5. ⬜ Integrate backend
6. ⬜ Test with multiple devices
7. ⬜ Deploy to production

Need help? Ask Cursor AI: "Help me integrate Supabase into this game show app"
