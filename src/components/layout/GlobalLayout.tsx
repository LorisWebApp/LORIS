import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, Users, Upload, Settings, WifiOff, Heart, NotebookPen, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '../../modules/group-a/contexts/AuthContext';
import { AssistantProvider } from '../assistant/AssistantProvider';
import { AssistantWidget } from '../assistant/AssistantWidget';
import { ContentProtection } from './ContentProtection';

type NavItem = { to: string; label: string; icon: typeof BookOpen; end?: boolean };

export function GlobalLayout() {
  const { user, loading, signOut, isPlatformManager, isOrgAdmin, homePath } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen grid place-items-center bg-page text-deep">Loading LORIS…</div>;
  if (!user) {
    // The catalogue and material descriptions are public; everything else needs an account.
    const isPublicCatalogue = location.pathname === '/catalogue' || location.pathname.startsWith('/material/');
    if (isPublicCatalogue) return <GuestLayout />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const items: NavItem[] = (() => {
    if (isPlatformManager) return [
      { to: '/platform', label: 'Platform dashboard', icon: LayoutDashboard },
      { to: '/catalogue', label: 'Catalogue', icon: Library },
    ];
    if (isOrgAdmin) return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/catalogue', label: 'Catalogue', icon: Library },
      { to: '/manage', label: 'Library management', icon: BookOpen },
      { to: '/manage/materials', label: 'Materials', icon: Settings },
      { to: '/manage/members', label: 'Members', icon: Users },
      { to: '/upload', label: 'Upload', icon: Upload },
    ];
    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/catalogue', label: 'Catalogue', icon: Library },
      { to: '/user/my-library', label: 'My Library', icon: BookOpen },
      { to: '/user/favourites', label: 'Favourites', icon: Heart },
      { to: '/user/notes-bookmarks', label: 'Notes', icon: NotebookPen },
      { to: '/offline-library', label: 'Offline Library', icon: WifiOff },
      { to: '/user/profile', label: 'Profile', icon: UserRound },
    ];
  })();

  return <AssistantProvider>
    <ContentProtection />
    <div className="min-h-screen bg-page text-deep">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-5 py-4 lg:px-8">
          <Link to={homePath} className="flex shrink-0 items-center gap-3 no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white"><BookOpen size={23}/></span>
            <span className="text-2xl font-semibold tracking-tight text-deep">LORIS</span>
          </Link>
          <nav aria-label="Global navigation" className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2">
            {items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-brand-text hover:bg-mint'}`}>
              <Icon size={17}/>{label}
            </NavLink>)}
          </nav>
          <button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-brand-text hover:bg-mint"><LogOut size={16}/> Sign out</button>
        </div>
      </header>
      <main className="min-h-[calc(100vh-73px)]"><Outlet /></main>
    </div>
    {!isPlatformManager && !isOrgAdmin && <AssistantWidget />}
  </AssistantProvider>;
}

/** Minimal public chrome for visitors browsing the catalogue without an account. */
function GuestLayout() {
  return <div className="min-h-screen bg-page text-deep">
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-5 py-4 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 no-underline">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white"><BookOpen size={23}/></span>
          <span className="text-2xl font-semibold tracking-tight text-deep">LORIS</span>
        </Link>
        <nav aria-label="Public navigation" className="ml-auto flex items-center gap-2">
          <Link to="/" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-brand-text no-underline hover:bg-mint sm:inline-flex">Home</Link>
          <Link to="/login" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand-text no-underline hover:bg-mint">Login</Link>
          <Link to="/register" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-deep">Get Started</Link>
        </nav>
      </div>
    </header>
    <main className="min-h-[calc(100vh-73px)]"><Outlet /></main>
  </div>;
}

export function RequireRole({ role, children }: { role: 'platform_manager' | 'admin' | 'end_user'; children: ReactNode }) {
  const { loading, profile, isPlatformManager, isOrgAdmin, homePath } = useAuth();
  const location = useLocation();
  // Wait for session + profile + memberships; never decide on partial data.
  if (loading) return <div className="min-h-screen grid place-items-center">Checking permissions…</div>;

  const allowed =
    role === 'platform_manager' ? isPlatformManager
    : role === 'admin' ? isOrgAdmin
    : Boolean(profile) && profile?.platform_role === 'end_user';

  if (allowed) return <>{children}</>;
  // Signed-in user with a different role: send them to their own home instead of a dead end.
  if (profile && homePath !== location.pathname) return <Navigate to={homePath} replace />;
  return <div className="mx-auto max-w-xl p-12 text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-muted">Your account does not have permission to access this section.</p></div>;
}

/** Login/registration pages: signed-in users go straight to their role home, never the landing page. */
export function PublicOnly({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading, homePath, isOrgAdmin, isPlatformManager } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-page text-deep">Loading LORIS…</div>;
  // adminOnly (the organisation login): a signed-in non-admin stays on the page, where the
  // login form explains why, instead of being sent on to the end-user dashboard.
  if (user && profile && (!adminOnly || isOrgAdmin || isPlatformManager)) return <Navigate to={homePath} replace />;
  return <>{children}</>;
}
