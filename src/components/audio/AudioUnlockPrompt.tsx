'use client';

import { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';

export function AudioUnlockPrompt() {
  const [needsUnlock, setNeedsUnlock] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNeedsUnlock(audioEngine.isSuspended());
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!needsUnlock) return null;

  const handleUnlock = async () => {
    await audioEngine.resume();
    setNeedsUnlock(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={handleUnlock}
        className="glass px-4 py-2 rounded-full text-sm text-brand-text shadow-lg hover:glass-strong transition-all"
      >
        Click to enable audio
      </button>
    </div>
  );
}
