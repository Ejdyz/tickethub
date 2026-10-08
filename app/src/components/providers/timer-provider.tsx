'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerContextType {
  isRunning: boolean;
  seconds: number;
  activeTicketId: number | null;
  activeTicketName: string | null;
  startTimer: (ticketId: number, ticketName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  formattedTime: string;
}

const TimerContext = createContext<TimerContextType>({
  isRunning: false,
  seconds: 0,
  activeTicketId: null,
  activeTicketName: null,
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  resetTimer: () => {},
  formattedTime: '00:00:00'
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeTicketName, setActiveTicketName] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tickethub_active_timer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.activeTicketId) {
          setActiveTicketId(parsed.activeTicketId);
          setActiveTicketName(parsed.activeTicketName);
          const elapsed = parsed.startTime ? Math.floor((Date.now() - parsed.startTime) / 1000) + (parsed.initialSeconds || 0) : parsed.seconds || 0;
          setSeconds(elapsed);
          if (parsed.isRunning) {
            setIsRunning(true);
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (activeTicketId) {
      localStorage.setItem('tickethub_active_timer', JSON.stringify({
        activeTicketId,
        activeTicketName,
        seconds,
        isRunning,
        startTime: isRunning ? Date.now() - (seconds * 1000) : null
      }));
    } else {
      localStorage.removeItem('tickethub_active_timer');
    }
  }, [activeTicketId, activeTicketName, seconds, isRunning]);

  const startTimer = (ticketId: number, ticketName: string) => {
    setActiveTicketId(ticketId);
    setActiveTicketName(ticketName);
    setSeconds(0);
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);
  const resumeTimer = () => setIsRunning(true);

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    setActiveTicketId(null);
    setActiveTicketName(null);
    localStorage.removeItem('tickethub_active_timer');
  };

  const format = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        seconds,
        activeTicketId,
        activeTicketName,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        formattedTime: format(seconds)
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}

