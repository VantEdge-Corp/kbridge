/**
 * Thin, monochrome, outline icons. Every icon in the app goes through this
 * module so stroke width and sizes stay consistent (18-22px, nav 20px).
 */
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  ArrowLeft,
  Ban,
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Compass,
  Database,
  ExternalLink,
  FileText,
  Flag,
  Home,
  Inbox,
  Info,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User,
  UserX,
  Users,
  X,
} from 'lucide-react';

export type IconName =
  | 'arrowLeft'
  | 'ban'
  | 'bell'
  | 'bookmark'
  | 'camera'
  | 'check'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'alert'
  | 'verified'
  | 'clipboard'
  | 'compass'
  | 'database'
  | 'external'
  | 'fileText'
  | 'flag'
  | 'home'
  | 'inbox'
  | 'info'
  | 'lock'
  | 'logOut'
  | 'mail'
  | 'mapPin'
  | 'comment'
  | 'message'
  | 'minus'
  | 'more'
  | 'feed'
  | 'pencil'
  | 'plus'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shieldCheck'
  | 'sliders'
  | 'trash'
  | 'user'
  | 'userX'
  | 'users'
  | 'x';

const ICONS: Record<IconName, LucideIcon> = {
  arrowLeft: ArrowLeft,
  ban: Ban,
  bell: Bell,
  bookmark: Bookmark,
  camera: Camera,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  alert: CircleAlert,
  verified: CircleCheck,
  clipboard: ClipboardList,
  compass: Compass,
  database: Database,
  external: ExternalLink,
  fileText: FileText,
  flag: Flag,
  home: Home,
  inbox: Inbox,
  info: Info,
  lock: Lock,
  logOut: LogOut,
  mail: Mail,
  mapPin: MapPin,
  comment: MessageCircle,
  message: MessageSquare,
  minus: Minus,
  more: MoreHorizontal,
  feed: Newspaper,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  send: Send,
  settings: Settings,
  shield: Shield,
  shieldCheck: ShieldCheck,
  sliders: SlidersHorizontal,
  trash: Trash2,
  user: User,
  userX: UserX,
  users: Users,
  x: X,
};

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.5, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...rest} />;
}
