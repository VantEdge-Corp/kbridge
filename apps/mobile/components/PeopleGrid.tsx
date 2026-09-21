import React, { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, useWindowDimensions, type ViewToken } from 'react-native';
import type { PublicProfile } from '@peaches/core';
import { GRID_GAP, PAGE_PADDING, cardWidthFor } from '@/constants/layout';
import { PersonCard } from './PersonCard';
import { useTheme } from '@/lib/theme';

interface Props {
  people: PublicProfile[];
  refreshing?: boolean;
  onRefresh?: () => void;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  /** Called with the ids that actually came into view, for exposure balancing. */
  onViewed?: (ids: string[]) => void;
}

/** Two-column, vertically scrolling grid of PersonCard. Card width is computed from the window. */
export function PeopleGrid({ people, refreshing, onRefresh, ListEmptyComponent, ListHeaderComponent, onViewed }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = cardWidthFor(width);
  const onViewedRef = useRef(onViewed);
  onViewedRef.current = onViewed;

  const viewability = useRef({
    viewabilityConfig: { itemVisiblePercentThreshold: 50, minimumViewTime: 300 },
    onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken<PublicProfile>[] }) => {
      const ids = viewableItems.map((v) => v.item.id);
      if (ids.length > 0) onViewedRef.current?.(ids);
    },
  }).current;

  const renderItem = useCallback(({ item }: { item: PublicProfile }) => <PersonCard profile={item} width={cardWidth} />, [cardWidth]);

  return (
    <FlatList
      data={people}
      keyExtractor={(p) => p.id}
      numColumns={2}
      renderItem={renderItem}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[styles.content, people.length === 0 && styles.contentEmpty]}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} /> : undefined}
      viewabilityConfig={viewability.viewabilityConfig}
      onViewableItemsChanged={viewability.onViewableItemsChanged}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  column: { gap: GRID_GAP, paddingHorizontal: PAGE_PADDING, marginBottom: 20 },
  content: { paddingTop: PAGE_PADDING, paddingBottom: 24 },
  contentEmpty: { flexGrow: 1 },
});
