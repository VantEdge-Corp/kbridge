import { Suspense } from 'react';
import { LuClipboardList, LuFlag, LuUsers } from 'react-icons/lu';
import { Outlet } from 'react-router-dom';
import { AdminSidebar, initialSidebarOpen, type NavItem } from '@/components/AppShell';
import { LoadingBlock } from '@/components/Loading';
import { Wordmark } from '@/components/Wordmark';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AREAS: ReadonlyArray<NavItem> = [
  { to: '/admin', label: 'Applications', icon: LuClipboardList, end: true },
  { to: '/admin/members', label: 'Members', icon: LuUsers },
  { to: '/admin/reports', label: 'Reports', icon: LuFlag },
];

/** Committee panel chrome: the shared sidebar with the committee's areas; on phones it opens from the top bar. */
export function AdminShell() {
  return (
    <SidebarProvider defaultOpen={initialSidebarOpen()}>
      <AdminSidebar items={AREAS} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Wordmark className="text-base" />
          <Badge variant="secondary">Committee</Badge>
        </header>
        <div className="mx-auto w-full max-w-[1080px] px-4 py-6 md:px-8 md:py-10">
          {/* Each area is its own chunk; keep the shell up while one loads. */}
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
