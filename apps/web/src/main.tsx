import React from 'react';
import { createRoot } from 'react-dom/client';
import { IconContext } from 'react-icons';
import '@/index.css';
import { App } from '@/App';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/lib/theme';

/** Icons are decorative by default; the control around one carries its accessible name. */
const ICONS = { attr: { 'aria-hidden': true, focusable: 'false' } } as const;

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');
createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <IconContext.Provider value={ICONS}>
        <TooltipProvider>
          <Toaster>
            <App />
          </Toaster>
        </TooltipProvider>
      </IconContext.Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
