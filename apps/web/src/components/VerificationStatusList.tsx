import { useState } from 'react';
import { LuBadgeCheck, LuCircleDashed, LuClock3, LuCircleX } from 'react-icons/lu';
import { VERIFICATION_DIMENSIONS, VERIFICATION_LABEL, VERIFICATION_STATE_LABEL, type VerificationData, type VerificationDimension, type VerificationState } from '@peaches/core';
import { Notice } from '@/components/Notice';
import { RowGroup } from '@/components/SettingsRow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const HELP: Record<VerificationDimension, string> = {
  identity: 'The committee confirms you are who your profile says. No ID upload; we review what you told us and may reach out.',
  education: 'Your school and degree as entered in your profile.',
  student: 'Current enrollment, for students.',
  employment: 'Your occupation and employer as entered in your profile.',
};

const STATE_ICON: Record<VerificationState, typeof LuBadgeCheck> = {
  verified: LuBadgeCheck,
  pending: LuClock3,
  rejected: LuCircleX,
  unverified: LuCircleDashed,
};

/** The member's own state per dimension, with a request action. Other members only ever see verified dimensions. */
export function VerificationStatusList({ verification, onChanged }: { verification: VerificationData; onChanged?: () => void }) {
  const [busy, setBusy] = useState<VerificationDimension | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = async (d: VerificationDimension) => {
    setBusy(d);
    setError(null);
    try {
      await api.verification.request(d);
      onChanged?.();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-3">
      <RowGroup>
        {VERIFICATION_DIMENSIONS.map((d) => {
          const state = verification[d];
          const Icon = STATE_ICON[state];
          return (
            <Item key={d} className="flex-nowrap items-start rounded-none px-4 py-3.5 max-sm:flex-wrap">
              <ItemMedia variant="icon" className={cn(state === 'verified' ? 'text-verified' : 'text-muted-foreground')}>
                <Icon />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>
                  {VERIFICATION_LABEL[d]}
                  <Badge variant={state === 'verified' ? 'secondary' : 'outline'} className={cn(state === 'verified' && 'text-verified')}>
                    {VERIFICATION_STATE_LABEL[state]}
                  </Badge>
                </ItemTitle>
                <ItemDescription>{HELP[d]}</ItemDescription>
              </ItemContent>
              {state === 'unverified' || state === 'rejected' ? (
                <ItemActions className="max-sm:basis-full max-sm:pl-8">
                  <Button size="sm" variant="outline" onClick={() => void request(d)} disabled={busy === d}>
                    {busy === d ? <Spinner data-icon="inline-start" /> : null}
                    Request review
                  </Button>
                </ItemActions>
              ) : null}
            </Item>
          );
        })}
      </RowGroup>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
