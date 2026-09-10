import AsyncStorage from '@react-native-async-storage/async-storage';

export const STATUS_TOKEN_KEY = 'peaches_status_token';

export async function loadStatusToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STATUS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveStatusToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STATUS_TOKEN_KEY, token);
  } catch {
    /* the token is also shown on screen; storage is a convenience */
  }
}
