"use client";

import { useState, useEffect } from "react";
import { LAUNCH_TIME } from "@/lib/launch-time";

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLaunched: boolean;
}

function calcRemaining(): CountdownState {
  const diff = LAUNCH_TIME.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isLaunched: false,
  };
}

const INITIAL: CountdownState = { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: false };

export function useLaunchCountdown(): CountdownState {
  const [state, setState] = useState<CountdownState>(INITIAL);

  useEffect(() => {
    // Set real value after mount to avoid SSR/client mismatch
    setState(calcRemaining());
    const id = setInterval(() => {
      const next = calcRemaining();
      setState(next);
      if (next.isLaunched) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
