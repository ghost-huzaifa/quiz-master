import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface QuizTimerProps {
  initialTime: number; // in seconds
  onTimeExpiry: () => void;
}

export function QuizTimer({ initialTime, onTimeExpiry }: QuizTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeExpiry();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onTimeExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeExpiry]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = timeRemaining <= 300; // Last 5 minutes
  const isCritical = timeRemaining <= 60; // Last 1 minute

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
      isCritical 
        ? 'bg-warning-red bg-opacity-20 animate-pulse'
        : isWarning
        ? 'bg-accent-yellow bg-opacity-20'
        : 'bg-google-blue bg-opacity-10'
    }`}>
      <Clock className={`w-5 h-5 ${
        isCritical 
          ? 'text-warning-red'
          : isWarning
          ? 'text-accent-yellow'
          : 'text-google-blue'
      }`} />
      <span className={`font-mono text-lg font-bold ${
        isCritical 
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
