// ─────────────────────────────────────────────────────────────────────────────
// DiscoverScreen.js — the deck. Candidates come from get_swipe_candidates
// (migration 007); each swipe is recorded and, on a mutual like, the match
// modal opens. If the *other* member completes the pair while we're browsing,
// the realtime match-stamp subscription raises the same modal.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, Loading, Empty, Button, Label } from '../components/ui.js';
import SwipeDeck from '../components/SwipeDeck.js';
import MatchModal from '../components/MatchModal.js';
import { useAuth } from '../auth/AuthContext.js';
import { displayProfile } from '../lib/profile.js';
import {
  getSwipeCandidates, recordSwipe, isDuplicateSwipe,
  subscribeToMatchStamps, getProfileById,
} from '../lib/swipes.js';
import { spacing } from '../theme.js';

const DECK_SIZE = 30;

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [deck, setDeck] = useState(null);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const seenMatchIds = useRef(new Set());

  const load = useCallback(async () => {
    try {
      setError('');
      const rows = await getSwipeCandidates(DECK_SIZE);
      setDeck(rows.map(displayProfile));
    } catch (e) {
      setError(e.message || 'Could not load profiles.');
      setDeck([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return undefined;
    return subscribeToMatchStamps(user.id, async (swipeRow) => {
      if (seenMatchIds.current.has(swipeRow.match_id)) return;
      seenMatchIds.current.add(swipeRow.match_id);
      try {
        const other = await getProfileById(swipeRow.swipee_id);
        if (other) setMatch({ profile: displayProfile(other), matchId: swipeRow.match_id });
      } catch {
        // The Matches tab will pick it up on next focus.
      }
    });
  }, [user?.id]);

  const handleSwipe = useCallback(async (direction, prof) => {
    setDeck(d => (d || []).filter(p => p.id !== prof.id));
    try {
      const result = await recordSwipe(user.id, prof.id, direction);
      if (direction === 'like' && result?.match_id && !seenMatchIds.current.has(result.match_id)) {
        seenMatchIds.current.add(result.match_id);
        setMatch({ profile: prof, matchId: result.match_id });
      }
    } catch (e) {
      if (!isDuplicateSwipe(e)) setError(e.message || 'That swipe did not save.');
    }
  }, [user?.id]);

  const openCorrespondence = () => {
    const m = match;
    setMatch(null);
    if (m) navigation.navigate('Chat', { matchId: m.matchId });
  };

  let body;
  if (deck === null) {
    body = <Loading />;
  } else if (deck.length === 0) {
    body = (
      <Empty
        title="No new members to consider."
        body={error || 'You have seen everyone for now. Check back soon.'}
      >
        <Button title="Look again" variant="ghost" onPress={load} style={{ marginTop: spacing(3) }} />
      </Empty>
    );
  } else {
    body = <SwipeDeck profile={deck[0]} nextProfile={deck[1]} onSwipe={handleSwipe} />;
  }

  return (
    <Screen>
      <ScreenHeader
        label="Discover"
        title="A few people worth meeting."
        right={error && deck?.length ? <Label style={{ color: '#d4928f' }}>offline?</Label> : null}
      />
      <View style={{ flex: 1 }}>{body}</View>
      <MatchModal
        visible={!!match}
        me={displayProfile(profile)}
        other={match?.profile}
        onMessage={openCorrespondence}
        onClose={() => setMatch(null)}
      />
    </Screen>
  );
}
