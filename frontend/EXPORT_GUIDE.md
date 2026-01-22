# Exporting Game Show App to Cursor for Backend Integration

## Step 1: Download the Project

### Option A: Download via Figma Make
1. Look for the "Export" or "Download" button in the Figma Make interface
2. This will download a ZIP file with all your code

### Option B: Manual File Copy
If no export option is available, manually copy these key files:

**Core Files:**
- `/src/app/App.tsx` - Main application entry
- `/src/app/types/game.ts` - Type definitions
- `/package.json` - Dependencies

**Components:**
- `/src/app/components/GameSetup.tsx`
- `/src/app/components/GameController.tsx`
- `/src/app/components/Scoreboard.tsx`
- `/src/app/components/PlayerMode.tsx`

**Player Components:**
- `/src/app/components/player/PlayerJoin.tsx`
- `/src/app/components/player/PlayerView.tsx`
- `/src/app/components/player/HostGameCode.tsx`

**Round Components:**
- `/src/app/components/rounds/TriviaBuzz.tsx`
- `/src/app/components/rounds/LightningRound.tsx`
- `/src/app/components/rounds/QuickBuild.tsx`
- `/src/app/components/rounds/Connect4.tsx`
- `/src/app/components/rounds/GuessNumber.tsx`
- `/src/app/components/rounds/BlindDraw.tsx`

**UI Components:**
- All files in `/src/app/components/ui/`

**Styles:**
- `/src/styles/theme.css`
- `/src/styles/fonts.css`
- `/src/index.css`

## Step 2: Set Up in Cursor

1. **Create new project folder:**
   ```bash
   mkdir game-show-app
   cd game-show-app
   ```

2. **Initialize Vite + React + TypeScript:**
   ```bash
   npm create vite@latest . -- --template react-ts
   ```

3. **Copy all downloaded files** into the project, maintaining folder structure

4. **Install dependencies:**
   ```bash
   npm install
   npm install lucide-react motion recharts react-slick
   npm install -D tailwindcss@4 postcss autoprefixer
   ```

5. **Verify Tailwind CSS v4 setup** in `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

6. **Test the app:**
   ```bash
   npm run dev
   ```

## Step 3: Backend Integration Plan

### A. Choose Your Backend

**Recommended: Supabase (Real-time + Auth)**
```bash
npm install @supabase/supabase-js
```

**Alternative: Firebase**
```bash
npm install firebase
```

**Alternative: Socket.io + Express**
```bash
npm install socket.io-client
```

### B. Database Schema (Supabase Example)

Create these tables in Supabase:

**Table: games**
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
  current_round INT DEFAULT 0,
  current_round_type VARCHAR(50),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Table: teams**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: players**
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: game_state**
```sql
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  current_question TEXT,
  current_category VARCHAR(100),
  current_points INT,
  time_remaining INT,
  can_buzz BOOLEAN DEFAULT false,
  buzzed_team_id UUID REFERENCES teams(id),
  current_turn_team_id UUID REFERENCES teams(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### C. Key Integration Points

**1. Game Code System (in `/src/services/gameService.ts`):**
```typescript
import { supabase } from './supabase';

export async function createGame(difficulty: string, rounds: string[]) {
  const code = generateGameCode();
  const { data, error } = await supabase
    .from('games')
    .insert({ code, difficulty })
    .select()
    .single();
  return data;
}

export async function joinGame(code: string, playerName: string, teamId: string) {
  // Verify game exists
  // Add player to database
  // Subscribe to real-time updates
}
```

**2. Real-time Sync (in `/src/hooks/useGameSync.ts`):**
```typescript
import { useEffect } from 'react';
import { supabase } from '@/services/supabase';

export function useGameSync(gameCode: string, onUpdate: (state: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameCode}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_state' },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode]);
}
```

**3. Buzz System (in `/src/services/buzzService.ts`):**
```typescript
export async function sendBuzz(gameId: string, teamId: string) {
  const { data, error } = await supabase
    .from('game_state')
    .update({ 
      buzzed_team_id: teamId,
      can_buzz: false 
    })
    .eq('game_id', gameId);
  
  return { success: !error };
}
```

## Step 4: Files to Create for Backend

Create these new files in Cursor:

1. **`/src/services/supabase.ts`** - Supabase client setup
2. **`/src/services/gameService.ts`** - Game CRUD operations
3. **`/src/services/buzzService.ts`** - Buzz-in logic
4. **`/src/hooks/useGameSync.ts`** - Real-time sync hook
5. **`/src/hooks/usePlayerState.ts`** - Player state management
6. **`/.env.local`** - Environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

## Step 5: Key Modifications Needed

### In `/src/app/components/GameController.tsx`:
- Replace `useState` with real-time sync
- Use `useGameSync(gameCode)` hook
- Send updates to backend when score changes
- Subscribe to game state changes

### In `/src/app/components/player/PlayerView.tsx`:
- Replace mock game state with `useGameSync`
- Send buzz events to backend
- Subscribe to question updates from host

### In `/src/app/components/player/PlayerJoin.tsx`:
- Call `joinGame()` API on form submit
- Validate game code with backend
- Fetch available teams from database

## Step 6: Testing Workflow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open in Cursor:**
   ```bash
   cursor .
   ```

3. **Test locally:**
   - Open `localhost:5173` in one browser (Host Mode)
   - Open `localhost:5173` in another browser (Player Mode)
   - Use the same game code to join

4. **Deploy:**
   ```bash
   npm run build
   # Deploy to Vercel, Netlify, or your hosting platform
   ```

## Step 7: Backend Integration Checklist

- [ ] Set up Supabase project
- [ ] Create database tables
- [ ] Configure Row Level Security (RLS) policies
- [ ] Create Supabase client in `/src/services/supabase.ts`
- [ ] Implement game service functions
- [ ] Add real-time subscriptions
- [ ] Replace mock data with API calls
- [ ] Test multi-device synchronization
- [ ] Add error handling
- [ ] Implement reconnection logic
- [ ] Add loading states
- [ ] Test with multiple players

## Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Real-time Docs:** https://supabase.com/docs/guides/realtime
- **Vite Docs:** https://vitejs.dev/
- **Motion Docs:** https://motion.dev/

## Need Help?

1. Use Cursor's AI to help implement backend logic
2. Ask: "Add Supabase real-time sync to GameController.tsx"
3. Ask: "Create a game service with CRUD operations"
4. Ask: "Implement buzz-in system with Supabase"

---

Good luck with your backend integration! 🚀
