import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  initialTime: number; // in seconds
  onTimeExpiry: () => void;
}

export function QuizTimer({ initialTime, onTimeExpiry }: QuizTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const hasExpired = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeRemaining(initialTime);
    hasExpired.current = false;
  }, [initialTime]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Don't start timer if already expired or time is 0
    if (hasExpired.current || timeRemaining <= 0) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (!hasExpired.current) {
            hasExpired.current = true;
            onTimeExpiry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onTimeExpiry]); // Depend on onTimeExpiry to ensure timer starts properly

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = timeRemaining <= 300; // Last 5 minutes
  const isCritical = timeRemaining <= 60; // Last 1 minute
  console.log(`Time remaining: ${timeDisplay}, Warning: ${isWarning}, Critical: ${isCritical}`);

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isCritical
      ? 'bg-warning-red bg-opacity-20 animate-pulse'
      : isWarning
        ? 'bg-accent-yellow bg-opacity-20'
        : 'bg-google-blue bg-opacity-10'
      }`}>
      <Clock className={`w-5 h-5 ${isCritical
        ? 'text-warning-red'
        : isWarning
          ? 'text-accent-yellow'
          : 'text-google-blue'
        }`} />
      <span className={`font-mono text-lg font-bold ${isCritical
        ? 'text-warning-red'
        : isWarning
          ? 'text-accent-yellow'
          : 'text-google-blue'
        }`}>
        {timeDisplay}
      </span>
    </div>
  );
}
