import { PREFERENCE_STRENGTHS, type PreferenceStrength } from '@peaches/core';
import { SegmentedControl } from '@/components/SegmentedControl';

const OPTIONS = PREFERENCE_STRENGTHS.map((value) => ({ value, label: { required: 'Required', preferred: 'Preferred', any: 'Any' }[value] }));

/** Required · Preferred · Any, one per preference row. */
export function PreferenceStrengthSelector({ value, onChange, label }: { value: PreferenceStrength; onChange: (s: PreferenceStrength) => void; label: string }) {
  return <SegmentedControl options={OPTIONS} value={value} onValueChange={onChange} label={`${label} strength`} size="sm" />;
}
