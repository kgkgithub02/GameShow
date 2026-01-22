import { Copy, Check, SkipForward, RotateCcw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { formatGameCode } from '@/app/utils/gameCode';

interface HostGameCodeProps {
  gameCode: string;
  onSkipRound?: () => void;
  onReset?: () => void;
}

export function HostGameCode({ gameCode, onSkipRound, onReset }: HostGameCodeProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatGameCode(gameCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={false}
        animate={{ width: expanded ? '200px' : '140px' }}
        className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg overflow-hidden"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-blue-300 uppercase font-medium flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Game Code
            </div>
            <div className="text-lg font-bold text-white tracking-wider">{formatGameCode(gameCode)}</div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/20"
            >
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
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}