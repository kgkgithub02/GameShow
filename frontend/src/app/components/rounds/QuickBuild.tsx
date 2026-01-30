import { useEffect, useState } from 'react';
import { Team, QuickBuildState } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Blocks, Trophy } from 'lucide-react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface QuickBuildProps {
  teams: Team[];
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  durationSeconds?: number;
}

export function QuickBuild({ teams, onUpdateScore, onComplete, gameId, durationSeconds }: QuickBuildProps) {
  const { gameState } = useGameSync(gameId);
  const roundSeconds = Math.min(Math.max(durationSeconds || 60, 30), 300);
  const [state, setState] = useState<QuickBuildState>({
    timeRemaining: roundSeconds,
    isActive: false,
    buildingTeam: null,
    winCriteria: 'tallest',
  });
  const [winner, setWinner] = useState<string | null>(null);
  const [tie, setTie] = useState(false);
  const [roundStarted, setRoundStarted] = useState(false);

  useEffect(() => {
    if (!state.isActive && !roundStarted && state.timeRemaining !== roundSeconds) {
      setState(prev => ({ ...prev, timeRemaining: roundSeconds }));
    }
  }, [roundSeconds, state.isActive, roundStarted, state.timeRemaining]);

  useEffect(() => {
    if (!state.isActive) return;
    const interval = window.setInterval(() => {
      setState(prev => {
        if (!prev.isActive) return prev;
        const next = Math.max(prev.timeRemaining - 1, 0);
        return next === 0 ? { ...prev, timeRemaining: 0, isActive: false } : { ...prev, timeRemaining: next };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.isActive]);

  useEffect(() => {
    if (!gameId) return;
    const phase = state.isActive
      ? 'building'
      : winner || tie
      ? 'complete'
      : roundStarted && state.timeRemaining < roundSeconds
      ? 'judging'
      : 'building';
    const roundData = {
      ...(gameState?.round_data || {}),
      quick_build: {
        challenge: getCriteriaDescription(),
        time_remaining: state.timeRemaining,
        total_time: roundSeconds,
        phase,
        winner_team_id: winner,
        tie: tie,
      },
    };
    updateGameState(gameId, {
      round_data: roundData,
    }).catch(() => undefined);
  }, [gameId, gameState, state.timeRemaining, state.isActive, winner, tie, roundStarted]);

  const startBuild = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: roundSeconds,
    }));
    setRoundStarted(true);
  };

  const handleTimeUp = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      timeRemaining: 0,
    }));
  };

  const selectWinner = (teamId: string) => {
    setWinner(teamId);
    setTie(false);
    onUpdateScore(teamId, 300);
  };

  const declareTie = () => {
    setTie(true);
    setWinner(null);
    teams.forEach(team => {
      onUpdateScore(team.id, 150);
    });
  };

  const getCriteriaDescription = () => {
    switch (state.winCriteria) {
      case 'tallest':
        return 'Build the tallest structure';
      case 'most-blocks':
        return 'Use the most blocks';
      case 'stability':
        return 'Build the most stable structure (must stand for 5 seconds)';
      default:
        return '';
    }
  };

  if (winner || tie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="h-20 w-20 text-yellow-400 mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">
          {tie ? "It's a Tie!" : 'We Have a Winner!'}
        </h2>
        {winner && (
          <div
            className="text-3xl font-bold px-8 py-4 rounded-full mb-4"
            style={{ backgroundColor: teams.find(t => t.id === winner)?.color }}
          >
            {teams.find(t => t.id === winner)?.name}
          </div>
        )}
        <p className="text-xl text-blue-200 mb-8">
          {tie ? '+150 points for each team' : '+300 points'}
        </p>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">🏗️ Quick Build</h2>
        <p className="text-blue-200 text-sm sm:text-base">{getCriteriaDescription()}</p>
        <p className="text-blue-200/70 text-xs sm:text-sm mt-1">Teams have {roundSeconds} seconds to build</p>
      </div>

      {!state.isActive && !winner && !tie && !roundStarted && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <Blocks className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <div className="space-y-4">
                <div>
                  <label className="text-white mb-2 block">Select Win Criteria</label>
                  <Select
                    value={state.winCriteria}
                    onValueChange={(v) =>
                      setState(prev => ({ ...prev, winCriteria: v as any }))
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tallest">Tallest Structure</SelectItem>
                      <SelectItem value="most-blocks">Most Blocks Used</SelectItem>
                      <SelectItem value="stability">Most Stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <h3 className="text-white font-bold mb-2">Instructions:</h3>
                  <ul className="text-blue-200 space-y-1 text-sm">
                    <li>• All teams build simultaneously</li>
                    <li>• Use Jenga blocks or similar materials</li>
                    <li>• Winner gets +300 points</li>
                    <li>• Tie: +150 points each</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={startBuild}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Blocks className="mr-2 h-5 w-5" />
            Start Building!
          </Button>
        </div>
      )}

      {state.isActive && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6">
                <div className="text-white text-xl font-medium">
                  Teams are building...
                </div>
                <Timer
                  seconds={roundSeconds}
                  value={state.timeRemaining}
                  onComplete={handleTimeUp}
                  running={true}
                  size="lg"
                />
                <div className="grid grid-cols-2 gap-4 w-full">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      className="text-center p-4 rounded-lg"
                      style={{ backgroundColor: `${team.color}20`, borderLeft: `4px solid ${team.color}` }}
                    >
                      <div className="text-white font-bold">{team.name}</div>
                      <div className="text-white/70 text-sm mt-1">Building...</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!state.isActive && state.timeRemaining < roundSeconds && !winner && !tie && (
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl font-bold text-white text-center">Time's Up! Select Winner</h3>
          
          <div className="grid gap-4">
            {teams.map(team => (
              <Button
                key={team.id}
                onClick={() => selectWinner(team.id)}
                size="lg"
                style={{ backgroundColor: team.color }}
                className="h-16 text-xl"
              >
                <Trophy className="mr-2 h-6 w-6" />
                {team.name} Wins
              </Button>
            ))}
          </div>

          <Button
            onClick={declareTie}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Declare Tie
          </Button>
        </div>
      )}
    </div>
  );
}