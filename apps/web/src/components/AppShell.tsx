import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { LuArrowLeft, LuChevronsUpDown, LuClipboardList, LuCompass, LuHouse, LuInbox, LuLogOut, LuNewspaper, LuPanelLeft, LuSettings, LuUser } from 'react-icons/lu';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BRAND } from '@peaches/core';
import { useAuth } from '@/auth/AuthProvider';
import { Monogram, Wordmark } from '@/components/Wordmark';
import { PersonAvatar } from '@/components/PersonAvatar';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '@/lib/theme';
import { cn } from '@/lib/utils';

export interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  /** Match only the exact path, for an index route. */
  end?: boolean;
}

export const MEMBER_NAV: ReadonlyArray<NavItem> = [
  { to: '/home', label: 'Home', icon: LuHouse },
  { to: '/explore', label: 'Explore', icon: LuCompass },
  { to: '/feed', label: 'Feed', icon: LuNewspaper },
  { to: '/inbox', label: 'Inbox', icon: LuInbox },
  { to: '/me', label: 'Me', icon: LuUser },
];

/** Routes that belong to a nav item without sharing its prefix. */
const SECTION_ALIASES: Record<string, string> = { '/chat': '/inbox', '/settings': '/me', '/post': '/feed', '/profile': '/home' };

function isActive(pathname: string, item: NavItem): boolean {
  if (item.end) return pathname === item.to;
  if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
  const alias = Object.keys(SECTION_ALIASES).find((prefix) => pathname.startsWith(prefix));
  return alias ? SECTION_ALIASES[alias] === item.to : false;
}

/** The sidebar remembers expanded or collapsed in a cookie; without one, it starts collapsed on narrower desktops. */
export function initialSidebarOpen(): boolean {
  const saved = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/)?.[1];
  if (saved) return saved === 'true';
  return window.matchMedia('(min-width: 1280px)').matches;
}

/** Brand row: the monogram square and the wordmark; collapsed, only the square. */
function SidebarBrand({ to }: { to: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={BRAND.name} render={<Link to={to} aria-label={`${BRAND.name} home`} />}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Monogram className="text-base text-primary-foreground" />
          </span>
          <Wordmark className="text-base" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function SidebarNav({ items }: { items: ReadonlyArray<NavItem> }) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton isActive={active} tooltip={item.label} render={<NavLink to={item.to} end={item.end} aria-current={active ? 'page' : undefined} />}>
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const label = state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar';
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label} onClick={toggleSidebar} className="text-sidebar-foreground/70">
        <LuPanelLeft />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppearanceSubmenu() {
  const { preference, setPreference } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Appearance</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as ThemePreference)}>
          {THEME_PREFERENCES.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** The signed-in member at the foot of the sidebar, with account actions. */
export function SidebarUser({ admin = false }: { admin?: boolean }) {
  const { user, profile, signOut, setAdminAsMember } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  if (!profile) return null;
  const logOut = () => void signOut().then(() => navigate('/', { replace: true }));
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground" />}>
          <PersonAvatar name={profile.firstName} src={profile.photos[0] ?? null} className="size-8 rounded-md after:rounded-md *:rounded-md" />
          <span className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{profile.firstName}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </span>
          <LuChevronsUpDown className="ml-auto size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4} className="w-(--anchor-width) min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm font-medium text-foreground">{profile.firstName}</span>
              <span className="block truncate text-xs">{user?.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {admin ? (
            <DropdownMenuItem
              onClick={() => {
                setAdminAsMember(true);
                navigate('/home');
              }}
            >
              <LuHouse />
              View as member
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => navigate(`/profile/${profile.id}`)}>
                <LuUser />
                View your profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <LuSettings />
                Settings
              </DropdownMenuItem>
              {profile.isAdmin ? (
                <DropdownMenuItem
                  onClick={() => {
                    setAdminAsMember(false);
                    navigate('/admin');
                  }}
                >
                  <LuClipboardList />
                  Committee panel
                </DropdownMenuItem>
              ) : null}
            </>
          )}
          <AppearanceSubmenu />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logOut}>
            <LuLogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

/** Five tabs at the bottom of the screen under 768px, where the sidebar is hidden. */
function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="flex">
        {MEMBER_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors focus-visible:bg-accent',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Member chrome: a collapsible sidebar from 768px, a bottom tab bar below. Settings is reached from Me, never the nav. */
export function AppShell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
  return (
    <SidebarProvider defaultOpen={initialSidebarOpen()}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarBrand to="/home" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav items={MEMBER_NAV} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <CollapseButton />
            <SidebarUser />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className={cn('min-w-0 pb-16 md:pb-0', fullHeight && 'h-dvh overflow-hidden')}>
        <div className={cn('mx-auto w-full max-w-[1120px] px-4 md:px-8', fullHeight ? 'h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] md:h-full' : 'py-6 md:py-10')}>{children}</div>
      </SidebarInset>
      <TabBar />
    </SidebarProvider>
  );
}

/** The admin panel uses the same sidebar with its own items. */
export function AdminSidebar({ items }: { items: ReadonlyArray<NavItem> }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand to="/admin" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav items={items} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <CollapseButton />
          <SidebarUser admin />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Goes back in history when the page was reached inside the app, else to `fallback`. */
function HistoryBackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  // React Router marks the first entry of a session with key "default".
  const canGoBack = location.key !== 'default';
  return (
    <button type="button" aria-label="Back" onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-2 shrink-0')}>
      <LuArrowLeft />
    </button>
  );
}

/**
 * Page title with an optional description, back control, and right-side
 * actions. `back` is a path, or `{ history: fallback }` to return to wherever
 * the member came from.
 */
export function PageHeader({ title, description, back, actions, className }: { title: ReactNode; description?: ReactNode; back?: string | { history: string }; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-6 flex items-start justify-between gap-4 md:mb-8', className)}>
      <div className="flex min-w-0 items-start gap-2">
        {typeof back === 'string' ? (
          <Link to={back} aria-label="Back" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-2 shrink-0')}>
            <LuArrowLeft />
          </Link>
        ) : back ? (
          <HistoryBackButton fallback={back.history} />
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
