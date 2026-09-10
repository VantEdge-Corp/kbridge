import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Re-runs `refresh` each time the screen regains focus (tab switch, coming
 * back from a pushed screen). Implemented with a plain navigation listener:
 * expo-router's useFocusEffect re-runs its effect on every render, which
 * turns a refresh-on-focus into a fetch loop.
 */
export function useRefreshOnFocus(refresh: () => void | Promise<unknown>): void {
  const navigation = useNavigation();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const mountedAt = useRef(Date.now());
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (Date.now() - mountedAt.current < 800) return; // initial focus: the screen already loads on mount
      void refreshRef.current();
    });
    return unsubscribe;
  }, [navigation]);
}
