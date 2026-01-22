import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Users, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { getGameByCode, joinGame, TeamDto } from '@/services/gameService';
import { formatGameCode, normalizeGameCode } from '@/app/utils/gameCode';

interface PlayerJoinProps {
  onJoin: (payload: {
    gameId: string;
    gameCode: string;
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamColor: string;
  }) => void;
}

export function PlayerJoin({ onJoin }: PlayerJoinProps) {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeGameCode(gameCode);
    if (normalized.length === 8) {
      setLoading(true);
      setError(null);
      try {
        const response = await getGameByCode(normalized);
        setTeams(response.teams);
        setStep('name');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to find game');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && selectedTeam) {
      setLoading(true);
      setError(null);
      try {
        const normalized = normalizeGameCode(gameCode);
        const player = await joinGame(normalized, playerName.trim(), selectedTeam);
        const team = teams.find(t => t.id === selectedTeam);
        if (!team) {
          throw new Error('Team not found');
        }
        onJoin({
          gameId: player.game_id,
          gameCode: normalized,
          playerId: player.id,
          playerName: player.name,
          teamId: player.team_id,
          teamName: team.name,
          teamColor: team.color,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join game');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Join Game</h1>
              <p className="text-blue-100">
                {step === 'code' 
                  ? 'Enter the 8-letter game code from your host' 
                  : 'Choose your team and enter your name'}
              </p>
            </div>

            {step === 'code' ? (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Game Code
                  </label>
                  <input
                    type="text"
                    value={formatGameCode(gameCode)}
                    onChange={(e) => setGameCode(normalizeGameCode(e.target.value).slice(0, 8))}
                    placeholder="ABCD-EFGH"
                    className="w-full px-4 py-4 text-center text-3xl font-bold tracking-wider bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    maxLength={9}
                    autoFocus
                  />
                  <p className="text-xs text-blue-200 mt-2">
                    Ask your game host for the code displayed on their screen
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg"
                  disabled={normalizeGameCode(gameCode).length !== 8 || loading}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {loading ? 'Loading...' : 'Continue'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-3">
                    Select Your Team
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {teams.map(team => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeam(team.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedTeam === team.id
                            ? 'ring-4 ring-white/50 border-white'
                            : 'border-white/30 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: `${team.color}80` }}
                      >
                        <div
                          className="w-8 h-8 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: team.color }}
                        />
                        <div className="text-white font-bold text-sm">
                          {team.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  {error && (
                    <p className="text-red-200 text-sm text-center">{error}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20"
                    onClick={() => setStep('code')}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-bold"
                    disabled={!playerName.trim() || !selectedTeam || loading}
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs text-blue-200 text-center">
                Game Code: <strong className="text-white">{formatGameCode(gameCode) || '---- ----'}</strong>
              </p>
              {error && (
                <p className="text-xs text-red-200 text-center mt-2">{error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
