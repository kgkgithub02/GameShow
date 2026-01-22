import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Brush, Eraser, RotateCcw, Clock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface PlayerBlindDrawProps {
  word: string | null; // Only shown to drawer
  isDrawer: boolean;
  isGuessingTeam?: boolean;
  timeRemaining: number;
  teamColor: string;
  phase: 'drawing' | 'judging' | 'complete';
  result?: 'guessed' | 'missed' | null;
}

export function PlayerBlindDraw({
  word,
  isDrawer,
  isGuessingTeam = false,
  timeRemaining,
  teamColor,
  phase,
  result,
}: PlayerBlindDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState('#FFFFFF');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || phase !== 'drawing') return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || phase !== 'drawing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-4">
      {/* Timer */}
      {phase === 'drawing' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-white" />
                <div>
                  <div className="text-3xl font-bold text-white">{timeRemaining}s</div>
                  <div className="text-xs text-blue-200">Remaining</div>
                </div>
              </div>
              <div className="text-right">
              <div className="text-sm text-blue-300 uppercase font-bold">
                {isDrawer
                  ? 'You are Drawing'
                  : isGuessingTeam
                  ? 'You are Guessing'
                  : 'You are Watching'}
              </div>
                {isDrawer && word && (
                  <div className="text-xs text-blue-200 mt-1">
                    Don't say the word out loud!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Word Display (Drawer Only) */}
      {isDrawer && word && phase === 'drawing' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl border-yellow-500/50">
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Eye className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-yellow-300 uppercase font-bold">
                    Your Secret Word
                  </span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">{word}</div>
                <p className="text-yellow-200 text-sm">
                  Draw this - but don't use letters or numbers!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Canvas */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full h-auto border-2 border-white/20 rounded-lg touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                cursor: isDrawer && phase === 'drawing' ? 'crosshair' : 'default',
                maxHeight: '400px',
              }}
            />
            {!isDrawer && phase === 'drawing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                <div className="text-center text-white">
                  <EyeOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-bold">Drawing in Progress...</p>
                  <p className="text-sm text-blue-200">
                    {isGuessingTeam
                      ? 'Watch the main screen and guess with your team'
                      : 'Watch the main screen'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Drawing Tools (Drawer Only) */}
          {isDrawer && phase === 'drawing' && (
            <div className="mt-4 space-y-3">
              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <Brush className="h-4 w-4 text-white" />
                <div className="flex gap-2">
                  {['#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c ? 'border-white scale-110' : 'border-white/30'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Brush Size */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium w-20">
                  Brush Size
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-bold w-8">{brushSize}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setColor('#1F2937')}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Eraser
                </Button>
                <Button
                  onClick={clearCanvas}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Instructions */}
      {phase === 'complete' ? (
        <Card className="bg-green-500/20 backdrop-blur-xl border-green-500/50">
          <CardContent className="pt-4 pb-4">
            <div className="text-center text-white">
              <p className="text-lg font-bold">Round Complete</p>
              <p className="text-sm text-green-100">
                {result === 'guessed'
                  ? 'Correct! +200 points.'
                  : result === 'missed'
                  ? 'Not guessed. 0 points.'
                  : 'Check the scoreboard for results.'}
              </p>
              {word && (
                <p className="text-sm text-green-100 mt-2">
                  Word: <span className="font-semibold text-white">{word}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : isDrawer ? (
        <Card className="bg-blue-500/20 backdrop-blur-xl border-blue-500/50">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2 text-sm text-white">
              <p className="font-bold text-blue-300">Drawing Rules:</p>
              <ul className="space-y-1 text-blue-100">
                <li>✏️ Draw the word shown above</li>
                <li>🚫 No letters or numbers allowed</li>
                <li>🤐 Don't say the word out loud</li>
                <li>👥 Your team will guess from the drawing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : isGuessingTeam ? (
        <Card className="bg-green-500/20 backdrop-blur-xl border-green-500/50">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2 text-sm text-white">
              <p className="font-bold text-green-300">Guessing Rules:</p>
              <ul className="space-y-1 text-green-100">
                <li>👀 Watch the drawing on the main screen</li>
                <li>💭 Think about what it could be</li>
                <li>🗣️ Shout out your guesses to the host</li>
                <li>⚡ Faster guess = more points!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2 text-sm text-white">
              <p className="font-bold text-blue-200">Watching</p>
              <ul className="space-y-1 text-blue-100">
                <li>👀 Watch the drawing on the main screen</li>
                <li>🤐 Only the drawing team can guess</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
