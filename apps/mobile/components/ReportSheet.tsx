import { REPORT_REASONS } from '@peaches/core';
import { ActionSheet } from './Sheet';

/** Picks a report reason. The caller files the report and confirms. */
export function ReportSheet({ visible, onClose, onSelect, title = 'Report' }: { visible: boolean; onClose: () => void; onSelect: (reason: string) => void; title?: string }) {
  return <ActionSheet visible={visible} onClose={onClose} title={title} actions={REPORT_REASONS.map((r) => ({ label: r, onPress: () => onSelect(r) }))} />;
}
