import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Platform } from 'react-native';

import type { PhaseType } from '@/types';

type TimerSoundParams = {
  currentItemId: string | null;
  currentItemType: PhaseType | null;
  status: 'idle' | 'running' | 'paused' | 'finished';
  soundEnabled: boolean;
};

export function useTimerSounds({
  currentItemId,
  currentItemType,
  status,
  soundEnabled,
}: TimerSoundParams) {
  const announcedItemIdRef = useRef<string | null>(null);
  const activePlayersRef = useRef<ReturnType<typeof createAudioPlayer>[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const player of activePlayersRef.current) {
        player.remove();
      }

      activePlayersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (status === 'idle' || status === 'finished') {
      announcedItemIdRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'running' || !currentItemId) {
      return;
    }

    if (announcedItemIdRef.current === currentItemId) {
      return;
    }

    announcedItemIdRef.current = currentItemId;

    if (!soundEnabled) {
      return;
    }

    if (currentItemType === 'work') {
      playOneShotSound(require('@/assets/sounds/work-start.mp3'), activePlayersRef);
    } else if (currentItemType === 'rest') {
      playOneShotSound(require('@/assets/sounds/rest-start.mp3'), activePlayersRef);
    }
  }, [currentItemId, currentItemType, soundEnabled, status]);
}

function playOneShotSound(
  source: number,
  activePlayersRef: MutableRefObject<ReturnType<typeof createAudioPlayer>[]>
) {
  const player = createAudioPlayer(source);
  activePlayersRef.current.push(player);
  player.play();

  setTimeout(() => {
    player.remove();
    activePlayersRef.current = activePlayersRef.current.filter(
      (activePlayer) => activePlayer !== player
    );
  }, 5000);
}
