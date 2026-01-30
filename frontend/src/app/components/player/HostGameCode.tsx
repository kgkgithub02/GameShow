import { Copy, Check, SkipForward, RotateCcw, Settings, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { formatGameCode } from '@/app/utils/gameCode';
import { Team } from '@/app/types/game';
import { PlayerStatus } from '@/hooks/useGameSync';

interface HostGameCodeProps {
  gameCode: string;
  onSkipRound?: () => void;
  onReset?: () => void;
  teams?: Team[];
  players?: PlayerStatus[];
}

export function HostGameCode({ gameCode, onSkipRound, onReset, teams = [], players = [] }: HostGameCodeProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatGameCode(gameCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative z-30">
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center justify-center h-8 w-8 rounded-md bg-white/10 hover:bg-white/20 border border-white/30"
        aria-label="Open host menu"
        title="Open host menu"
      >
        <Settings className="h-4 w-4 text-white" />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setExpanded(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-[calc(100vw-16px)] max-w-72 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/20">
                <div className="text-xs uppercase text-blue-300 font-medium">Host Menu</div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Close host menu"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase text-blue-300 font-medium flex items-center gap-2">
                Game Code
                <span className="text-xs text-white/80 tracking-wider">{formatGameCode(gameCode)}</span>
              </div>
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-white" />
                    <span className="text-white font-medium">Copy Code</span>
                  </>
                )}
              </button>
              {teams.length > 0 && (
                <button
                  onClick={() => setShowPlayers(prev => !prev)}
                  className="w-full px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm border-t border-white/10"
                >
                  <Users className="h-3 w-3 text-blue-300" />
                  <span className="text-white font-medium">
                    {showPlayers ? 'Hide Players' : 'Show Players'}
                  </span>
                </button>
              )}
              {showPlayers && teams.length > 0 && (
                <div className="border-t border-white/10 px-3 py-2 text-xs text-blue-100 max-h-56 overflow-y-auto">
                  {teams.map(team => {
                    const teamPlayers = players.filter(player => player.team_id === team.id);
                    return (
                      <div key={team.id} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 text-white font-semibold mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                          {team.name}
                        </div>
                        {teamPlayers.length === 0 ? (
                          <div className="text-blue-200">No players yet</div>
                        ) : (
                          <div className="space-y-1">
                            {teamPlayers.map(player => (
                              <div key={player.id} className="flex items-center justify-between">
                                <span>{player.name}</span>
                                <span className={player.connected ? 'text-green-300' : 'text-blue-200'}>
                                  {player.connected ? 'Online' : 'Left'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {onSkipRound && (
                <button
                  onClick={() => {
                    onSkipRound();
                    setExpanded(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm border-t border-white/10"
                >
                  <SkipForward className="h-3 w-3 text-orange-300" />
                  <span className="text-white font-medium">Skip Round</span>
                </button>
              )}
              {onReset && (
                <button
                  onClick={() => {
                    onReset();
                    setExpanded(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm border-t border-white/10"
                >
                  <RotateCcw className="h-3 w-3 text-red-300" />
                  <span className="text-white font-medium">Reset Game</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}