import Storage from 'expo-sqlite/kv-store';

const SOUND_ENABLED_KEY = 'sound_enabled';

export async function getSoundEnabled() {
  const rawValue = await Storage.getItem(SOUND_ENABLED_KEY);

  if (rawValue === null) {
    return true;
  }

  return rawValue === 'true';
}

export async function setSoundEnabled(enabled: boolean) {
  await Storage.setItem(SOUND_ENABLED_KEY, String(enabled));
}
