import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { getHostGameByCode, getGameState, mapTeamDto } from '@/services/gameService';
import { formatGameCode, normalizeGameCode } from '@/app/utils/gameCode';
import { RoundSettings, RoundType, Team } from '@/app/types/game';
import { GeneratedQuestions } from '@/app/utils/questionGenerator';

interface HostJoinPayload {
  gameId: string;
  gameCode: string;
  teams: Team[];
  rounds: RoundType[];
  difficulty: string | null;
  roundSettings: RoundSettings;
  generatedQuestions: GeneratedQuestions;
  status: string;
}

interface HostJoinProps {
  onJoin: (payload: HostJoinPayload & { setupStep?: 'config' | 'review' | 'game' }) => void;
  onBack: () => void;
}

export function HostJoin({ onJoin, onBack }: HostJoinProps) {
  const [gameCode, setGameCode] = useState('');
  const [hostPin, setHostPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeGameCode(gameCode);
    if (normalized.length !== 8 || hostPin.trim().length < 4) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getHostGameByCode(normalized, hostPin.trim());
      const gameState = await getGameState(response.game.id);
      const roundData = (gameState.round_data as any) || {};
      const setupData = roundData.game_setup || {};
      onJoin({
        gameId: response.game.id,
        gameCode: response.game.code,
        teams: response.teams.map(mapTeamDto),
        rounds: setupData.rounds || [],
        difficulty: response.game.difficulty,
        roundSettings: setupData.round_settings || {},
        generatedQuestions: roundData.generated_questions || {},
        status: response.game.status,
        setupStep: setupData.setup_step,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find game');
    } finally {
      setLoading(false);
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
                <Monitor className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Host Rejoin</h1>
              <p className="text-blue-100">
                Enter the game code to resume hosting
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Game Code
                </label>
                <input
                  type="text"
                  value={formatGameCode(gameCode)}
                  onChange={(event) => setGameCode(normalizeGameCode(event.target.value).slice(0, 8))}
                  placeholder="ABCD-EFGH"
                  className="w-full px-4 py-4 text-center text-3xl font-bold tracking-wider bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  maxLength={9}
                  autoFocus
                />
                <p className="text-xs text-blue-200 mt-2">
                  Use the code shown on the host screen
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Host PIN
                </label>
                <input
                  type="password"
                  value={hostPin}
                  onChange={(event) => setHostPin(event.target.value)}
                  placeholder="Enter host PIN"
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                />
              </div>

              {error && (
                <p className="text-red-200 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20"
                  onClick={onBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg"
                  disabled={normalizeGameCode(gameCode).length !== 8 || hostPin.trim().length < 4 || loading}
                >
                  {loading ? 'Loading...' : 'Rejoin Host'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
