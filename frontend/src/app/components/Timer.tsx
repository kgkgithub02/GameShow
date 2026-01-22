import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  seconds: number;
  value?: number;
  onComplete?: () => void;
  running?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Timer({ seconds, value, onComplete, running = true, size = 'md' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const hasCompletedRef = useRef(false);
  const isControlled = typeof value === 'number';
  const effectiveTime = isControlled ? value : timeLeft;

  useEffect(() => {
    setTimeLeft(seconds);
    hasCompletedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running || isControlled) return;

    if (timeLeft <= 0) {
      if (!hasCompletedRef.current && onComplete) {
        hasCompletedRef.current = true;
        // Use setTimeout to avoid calling setState during render
        setTimeout(() => onComplete(), 0);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, timeLeft, onComplete, isControlled]);

  const percentage = (effectiveTime / seconds) * 100;
  const isLow = effectiveTime <= 10;
  const isCritical = effectiveTime <= 5;

  const sizeClasses = {
    sm: 'text-2xl w-16 h-16',
    md: 'text-4xl w-24 h-24',
    lg: 'text-6xl w-32 h-32',
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg className={`${sizeClasses[size]} transform -rotate-90`}>
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke={isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#3b82f6'}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Clock className={`h-${size === 'lg' ? '8' : size === 'md' ? '6' : '4'} w-${size === 'lg' ? '8' : size === 'md' ? '6' : '4'} mx-auto text-white/70 mb-1`} />
            <div className={`${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-xl'} font-bold ${isCritical ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {effectiveTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}