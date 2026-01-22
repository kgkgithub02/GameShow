# Backend Integration Structure

## Supabase Setup Files

Create these files when integrating with Supabase:

### 1. Environment Variables (.env.local)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Client (/src/services/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Game Service (/src/services/gameService.ts)
```typescript
import { supabase } from './supabase';
import { Team, Difficulty, RoundType } from '@/app/types/game';

function generateGameCode(): string {
  return Array.from({ length: 6 }, () => 
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');
}

export async function createGame(
  teams: Team[], 
  difficulty: Difficulty, 
  rounds: RoundType[]
) {
  const code = generateGameCode();
  
  // Create game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      code,
      difficulty,
      status: 'waiting',
      current_round: 0,
      current_round_type: rounds[0],
    })
    .select()
    .single();

  if (gameError) throw gameError;

  // Create teams
  const teamsData = teams.map(team => ({
    game_id: game.id,
    name: team.name,
    color: team.color,
    score: 0,
  }));

  const { error: teamsError } = await supabase
    .from('teams')
    .insert(teamsData);

  if (teamsError) throw teamsError;

  // Initialize game state
  await supabase
    .from('game_state')
    .insert({
      game_id: game.id,
      can_buzz: false,
    });

  return { gameId: game.id, code };
}

export async function joinGame(
  code: string,
  playerName: string,
  teamId: string
) {
  // Verify game exists
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id')
    .eq('code', code)
    .single();

  if (gameError || !game) {
    throw new Error('Game not found');
  }

  // Add player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      team_id: teamId,
      name: playerName,
      connected: true,
    })
    .select()
    .single();

  if (playerError) throw playerError;

  return player;
}

export async function getGameState(gameId: string) {
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateGameState(gameId: string, updates: any) {
  const { error } = await supabase
    .from('game_state')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  if (error) throw error;
}

export async function updateTeamScore(teamId: string, points: number) {
  const { data: team } = await supabase
    .from('teams')
    .select('score')
    .eq('id', teamId)
    .single();

  const newScore = Math.max(0, (team?.score || 0) + points);

  const { error } = await supabase
    .from('teams')
    .update({ score: newScore })
    .eq('id', teamId);

  if (error) throw error;
}
```

### 4. Real-time Hooks (/src/hooks/useGameSync.ts)
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Team } from '@/app/types/game';

interface GameState {
  currentQuestion: string | null;
  category?: string;
  points?: number;
  timeRemaining?: number;
  canBuzz: boolean;
  buzzedTeam: string | null;
  currentTurn: string | null;
}

export function useGameSync(gameId: string) {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    canBuzz: false,
    buzzedTeam: null,
    currentTurn: null,
  });
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // Fetch initial state
    const fetchInitialState = async () => {
      const { data: state } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .single();

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId);

      if (state) {
        setGameState({
          currentQuestion: state.current_question,
          category: state.current_category,
          points: state.current_points,
          timeRemaining: state.time_remaining,
          canBuzz: state.can_buzz,
          buzzedTeam: state.buzzed_team_id,
          currentTurn: state.current_turn_team_id,
        });
      }

      if (teamsData) {
        setTeams(teamsData.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color,
          score: t.score,
        })));
      }
    };

    fetchInitialState();

    // Subscribe to game state changes
    const stateChannel = supabase
      .channel(`game_state:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setGameState({
            currentQuestion: updated.current_question,
            category: updated.current_category,
            points: updated.current_points,
            timeRemaining: updated.time_remaining,
            canBuzz: updated.can_buzz,
            buzzedTeam: updated.buzzed_team_id,
            currentTurn: updated.current_turn_team_id,
          });
        }
      )
      .subscribe();

    // Subscribe to team score changes
    const teamsChannel = supabase
      .channel(`teams:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setTeams(prev =>
            prev.map(t =>
              t.id === updated.id
                ? { ...t, score: updated.score }
                : t
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(teamsChannel);
    };
  }, [gameId]);

  return { gameState, teams };
}
```

### 5. Buzz Service (/src/services/buzzService.ts)
```typescript
import { supabase } from './supabase';

export async function sendBuzz(gameId: string, teamId: string) {
  // Check if buzzing is allowed
  const { data: state } = await supabase
    .from('game_state')
    .select('can_buzz, buzzed_team_id')
    .eq('game_id', gameId)
    .single();

  if (!state?.can_buzz || state.buzzed_team_id) {
    return { success: false, message: 'Cannot buzz right now' };
  }

  // Record the buzz
  const { error } = await supabase
    .from('game_state')
    .update({
      buzzed_team_id: teamId,
      can_buzz: false,
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function resetBuzz(gameId: string) {
  const { error } = await supabase
    .from('game_state')
    .update({
      buzzed_team_id: null,
      can_buzz: true,
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  return !error;
}

export async function enableBuzzing(gameId: string) {
  const { error } = await supabase
    .from('game_state')
    .update({
      can_buzz: true,
      buzzed_team_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  return !error;
}

export async function disableBuzzing(gameId: string) {
  const { error } = await supabase
    .from('game_state')
    .update({
      can_buzz: false,
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  return !error;
}
```

## Installation Steps

1. **Install Supabase client:**
```bash
npm install @supabase/supabase-js
```

2. **Create Supabase project:**
- Go to https://supabase.com
- Create new project
- Copy URL and anon key to `.env.local`

3. **Run SQL migrations** in Supabase SQL Editor (see EXPORT_GUIDE.md)

4. **Set up Row Level Security (RLS):**
```sql
-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (refine later)
CREATE POLICY "Allow all operations" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON game_state FOR ALL USING (true);
```

## Integration Points Summary

**Files to modify:**
1. `GameController.tsx` - Use `useGameSync` instead of `useState`
2. `PlayerView.tsx` - Use `useGameSync` and `sendBuzz`
3. `PlayerJoin.tsx` - Call `joinGame` API
4. `GameSetup.tsx` - Call `createGame` API

**Key changes:**
- Replace local state with Supabase real-time
- All score updates → `updateTeamScore`
- All question changes → `updateGameState`
- Buzz button → `sendBuzz`
- Listen for changes with `useGameSync` hook
