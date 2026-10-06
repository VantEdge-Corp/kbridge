import type { ReactNode } from 'react';
import { LuCircleAlert, LuInfo } from 'react-icons/lu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/** An inline message. `danger` is for errors and is announced to screen readers immediately. */
export function Notice({ children, title, tone = 'neutral', action, className }: { children: ReactNode; title?: ReactNode; tone?: 'neutral' | 'danger'; action?: ReactNode; className?: string }) {
  const danger = tone === 'danger';
  return (
    <Alert variant={danger ? 'destructive' : 'default'} role={danger ? 'alert' : 'status'} className={className}>
      {danger ? <LuCircleAlert /> : <LuInfo />}
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
      {action ? <div className="col-start-2 mt-2.5">{action}</div> : null}
    </Alert>
  );
}

/** A load failure with a retry. */
export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Notice
      tone="danger"
      title="Something went wrong"
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      {message}
    </Notice>
  );
}
