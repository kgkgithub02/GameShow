import { useEffect, useMemo, useRef, useState } from 'react';
import { Team } from '@/app/types/game';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Timer } from '@/app/components/Timer';
import { Trophy, Theater } from 'lucide-react';
import { motion } from 'motion/react';
import { updateGameState } from '@/services/gameService';
import { useGameSync } from '@/hooks/useGameSync';

interface DumpCharadesProps {
  teams: Team[];
  onUpdateScore: (teamId: string, points: number) => void;
  onComplete: () => void;
  gameId?: string | null;
  words?: string[];
  durationSeconds?: number;
}

export function DumpCharades({
  teams,
  onUpdateScore,
  onComplete,
  gameId,
  words,
  durationSeconds,
}: DumpCharadesProps) {
  const pickRandom = (pool: string[]) => pool[Math.floor(Math.random() * pool.length)];
  const { gameState, players } = useGameSync(gameId);
  const roundSeconds = Math.max(durationSeconds || 60, 1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [phase, setPhase] = useState<'prep' | 'acting' | 'judging' | 'complete'>('prep');
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [actorPlayerId, setActorPlayerId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(roundSeconds);
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<'guessed' | 'missed' | null>(null);
  const usedWordsRef = useRef<Set<string>>(new Set());

  const currentTeam = teams[currentTeamIndex];
  const teamPlayers = useMemo(() => {
    if (players.length > 0) {
      return players.filter(player => player.team_id === currentTeam?.id);
    }
    const fallbackNames = currentTeam?.players || [];
    return fallbackNames.map((name, index) => ({
      id: `${currentTeam?.id || 'team'}-player-${index}`,
      name: name || `Player ${index + 1}`,
      connected: true,
      team_id: currentTeam?.id || '',
    }));
  }, [players, currentTeam]);

  useEffect(() => {
    if (!isActive) return;
    const interval = window.setInterval(() => {
      setTimeRemaining(prev => {
        const next = Math.max(prev - 1, 0);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!gameId) return;
    const roundData = {
      ...(gameState?.round_data || {}),
      dump_charades: {
        word: currentWord,
        actor_team_id: currentTeam?.id || null,
        actor_player_id: actorPlayerId,
        time_remaining: timeRemaining,
        total_time: roundSeconds,
        is_active: isActive,
        phase,
        result,
      },
    };
    updateGameState(gameId, {
      current_turn_team_id: currentTeam?.id || null,
      round_data: roundData,
    }).catch(() => undefined);
  }, [
    gameId,
    gameState,
    currentWord,
    currentTeam,
    actorPlayerId,
    timeRemaining,
    roundSeconds,
    phase,
    result,
  ]);

  useEffect(() => {
    if (isActive && timeRemaining === 0) {
      setIsActive(false);
      setPhase('judging');
    }
  }, [isActive, timeRemaining]);

  const getWordPool = () => {
    return words && words.length ? words : ['charades', 'acting', 'mime'];
  };

  const pickUnusedWord = () => {
    const pool = getWordPool();
    if (!pool.length) return pickRandom(['charades', 'acting', 'mime']);
    const available = pool.filter(word => !usedWordsRef.current.has(word));
    if (!available.length) return null;
    const nextWord = available[Math.floor(Math.random() * available.length)];
    usedWordsRef.current.add(nextWord);
    return nextWord;
  };

  const pickWord = () => {
    const word = pickUnusedWord();
    if (!word) return;
    setCurrentWord(word);
    setPhase('acting');
    setIsActive(false);
    setTimeRemaining(roundSeconds);
    setResult(null);
  };

  const rerollWord = () => {
    if (phase !== 'acting' || isActive) return;
    const word = pickUnusedWord();
    if (!word) return;
    setCurrentWord(word);
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const handleGuessed = () => {
    if (!currentTeam) return;
    onUpdateScore(currentTeam.id, 200);
    setResult('guessed');
    setIsActive(false);
    setPhase('complete');
  };

  const handleMissed = () => {
    setResult('missed');
    setIsActive(false);
    setPhase('complete');
  };

  const nextTurn = () => {
    const nextIndex = (currentTeamIndex + 1) % teams.length;
    setCurrentTeamIndex(nextIndex);
    if (nextIndex === 0) {
      setRoundsCompleted(prev => prev + 1);
    }
    setPhase('prep');
    setCurrentWord(null);
    setActorPlayerId(null);
    setIsActive(false);
    setTimeRemaining(roundSeconds);
    setResult(null);
  };

  if (roundsCompleted >= 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="h-20 w-20 text-yellow-400 mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">Dump Charades Complete!</h2>
        <p className="text-xl text-blue-200 mb-8">All teams have acted</p>
        <Button onClick={onComplete} size="lg">
          Next Round
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">🎭 Dump Charades</h2>
        <p className="text-blue-200 text-sm sm:text-base">Act out the word without speaking</p>
        {currentTeam && (
          <div className="mt-3 sm:mt-4">
            <div
              className="inline-block text-lg sm:text-2xl font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full"
              style={{ backgroundColor: currentTeam.color }}
            >
              {currentTeam.name}'s Turn
            </div>
          </div>
        )}
      </div>

      {phase === 'prep' && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <Theater className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <div className="text-center mb-6">
                <p className="text-white text-lg mb-2">
                  <strong>{currentTeam?.name}</strong> is up to act
                </p>
                <p className="text-blue-200">Select the player who will act out the word</p>
              </div>
              <div className="space-y-3 mb-6">
                {teamPlayers.length === 0 ? (
                  <div className="text-sm text-blue-200 text-center">
                    No connected players on {currentTeam?.name}.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {teamPlayers.map(player => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setActorPlayerId(player.id)}
                        className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          actorPlayerId === player.id
                            ? 'border-white ring-2 ring-white/40 text-white'
                            : 'border-white/30 text-blue-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{player.name}</span>
                          <span className={player.connected ? 'text-green-300' : 'text-blue-300'}>
                            {player.connected ? 'Online' : 'Left'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={pickWord}
                size="lg"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!actorPlayerId}
              >
                Pick a Word
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {phase !== 'prep' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="text-sm uppercase tracking-wide text-blue-200">Secret Word</div>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {currentWord ? currentWord : 'Waiting...'}
                </div>
                <p className="text-blue-200">
                  The word is visible only to the acting player once you start.
                </p>
                {!isActive && phase === 'acting' && (
                  <div className="space-y-2">
                    <Button onClick={startTimer} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                      Start Acting
                    </Button>
                    <Button
                      onClick={rerollWord}
                      size="lg"
                      variant="outline"
                      className="w-full border-white/30 text-white bg-white/10 hover:bg-white/20"
                    >
                      Pick Another Word
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {(phase === 'judging' || (phase === 'acting' && isActive)) && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 space-y-4 text-center">
                  <div className="text-xl font-bold text-white">
                    Did the team guess the word?
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleGuessed} size="lg" className="bg-green-600 hover:bg-green-700">
                      Guessed (+200)
                    </Button>
                    <Button onClick={handleMissed} size="lg" className="bg-red-600 hover:bg-red-700">
                      Not Guessed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {phase === 'complete' && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="text-2xl font-bold text-white">
                    {result === 'guessed' ? '✓ Correct! +200 points' : 'No points awarded'}
                  </div>
                  <Button onClick={nextTurn} size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                    Next Team
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {phase === 'acting' && isActive && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Timer
                    seconds={roundSeconds}
                    value={timeRemaining}
                    running={isActive}
                    size="lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
