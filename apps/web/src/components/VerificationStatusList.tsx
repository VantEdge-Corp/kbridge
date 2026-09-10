import { useState } from 'react';
import { VERIFICATION_DIMENSIONS, VERIFICATION_LABEL, VERIFICATION_STATE_LABEL, type VerificationData, type VerificationDimension } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { Button } from './Button';
import { Notice } from './Field';
import { Icon } from './icons';

const HELP: Record<VerificationDimension, string> = {
  identity: 'The committee confirms you are who your profile says. No ID upload; we review what you told us and may reach out.',
  education: 'Your school and degree as entered in your profile.',
  student: 'Current enrollment, for students.',
  employment: 'Your occupation and employer as entered in your profile.',
};

/** The member's own verification state per dimension, with a request action. */
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
    <div>
      <ul className="divide-y divide-border">
        {VERIFICATION_DIMENSIONS.map((d) => {
          const state = verification[d];
          return (
            <li key={d} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <span className={state === 'verified' ? 'text-verified' : 'text-text-faint'}>
                <Icon name="verified" size={18} />
              </span>
              <span className="flex-1 min-w-[200px]">
                <span className="block text-body text-text">{VERIFICATION_LABEL[d]}</span>
                <span className="block text-caption text-text-muted">{HELP[d]}</span>
              </span>
              <span className="ml-auto flex items-center gap-3 pl-[30px] sm:pl-0">
                <span className="text-caption text-text-muted shrink-0">{VERIFICATION_STATE_LABEL[state]}</span>
                {state === 'unverified' || state === 'rejected' ? (
                  <Button size="sm" variant="secondary" onClick={() => void request(d)} disabled={busy === d}>
                    Request review
                  </Button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
    </div>
  );
}
