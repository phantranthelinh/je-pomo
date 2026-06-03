'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useAudioStore } from '@/stores/audio-store';
import { useShallow } from 'zustand/react/shallow';
import { SOUND_CATALOG } from '@/lib/sounds';

type HowlMap = Record<string, Howl>;

export function useAudioMixer() {
  const store = useAudioStore(
    useShallow((s) => ({
      channels: s.channels,
      masterVolume: s.masterVolume,
      isMuted: s.isMuted,
      setVolume: s.setVolume,
      toggleChannel: s.toggleChannel,
      setMasterVolume: s.setMasterVolume,
      toggleMute: s.toggleMute,
      loadMix: s.loadMix,
      resetMix: s.resetMix,
    }))
  );
  const howlsRef = useRef<HowlMap>({});

  const getOrCreateHowl = useCallback((id: string): Howl | null => {
    if (howlsRef.current[id]) return howlsRef.current[id];

    const sound = SOUND_CATALOG.find((s) => s.id === id);
    if (!sound) return null;

    const howl = new Howl({
      src: [sound.src],
      html5: true,
      loop: true,
      preload: false,
      volume: 0,
    });

    howlsRef.current[id] = howl;
    return howl;
  }, []);

  const destroyHowl = useCallback((id: string) => {
    const howl = howlsRef.current[id];
    if (howl) {
      howl.stop();
      howl.unload();
      delete howlsRef.current[id];
    }
  }, []);

  const { channels, masterVolume, isMuted } = store;

  // Sync store state → Howl instances
  useEffect(() => {
    for (const [id, channel] of Object.entries(channels)) {
      if (channel.enabled && !isMuted) {
        const howl = getOrCreateHowl(id);
        if (!howl) continue;

        const effectiveVolume = channel.volume * masterVolume;
        howl.volume(effectiveVolume);

        if (!howl.playing()) {
          howl.play();
        }
      } else {
        const howl = howlsRef.current[id];
        if (howl && howl.playing()) {
          howl.pause();
        }

        // Destroy if disabled to free memory
        if (!channel.enabled && howlsRef.current[id]) {
          destroyHowl(id);
        }
      }
    }
  }, [channels, masterVolume, isMuted, getOrCreateHowl, destroyHowl]);

  // Cleanup all Howl instances on unmount
  useEffect(() => {
    return () => {
      const howls = howlsRef.current;
      for (const howl of Object.values(howls)) {
        howl.stop();
        howl.unload();
      }
      howlsRef.current = {};
    };
  }, []);

  return {
    channels: store.channels,
    masterVolume: store.masterVolume,
    isMuted: store.isMuted,
    setVolume: store.setVolume,
    toggleChannel: store.toggleChannel,
    setMasterVolume: store.setMasterVolume,
    toggleMute: store.toggleMute,
    loadMix: store.loadMix,
    resetMix: store.resetMix,
  };
}
