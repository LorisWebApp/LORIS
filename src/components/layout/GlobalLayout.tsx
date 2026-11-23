import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, Upload, WifiOff, Heart, NotebookPen, UserRound, LogOut, Menu, X, ClipboardList, Building2, FolderOpen, Users } from 'lucide-react';
import { useAuth } from '../../modules/group-a/contexts/AuthContext';
import { AssistantProvider } from '../assistant/AssistantProvider';
import { AssistantWidget } from '../assistant/AssistantWidget';
import { ContentProtection } from './ContentProtection';
import { PublicHeader } from '../../modules/group-a/components/layouts/PublicHeader';

type NavItem = { to: string; label: string; icon: typeof BookOpen; end?: boolean };

export function GlobalLayout() {
  const { user, loading, signOut, isPlatformManager, isOrgAdmin, homePath } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Close the mobile menu whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-page text-deep">Loading LORIS…</div>;
  if (!user) {
    // The catalogue and material descriptions are public; everything else needs an account.
    const isPublicCatalogue = location.pathname === '/catalogue' || location.pathname.startsWith('/material/');
    if (isPublicCatalogue) return <GuestLayout />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const items: NavItem[] = (() => {
    // Group A's Platform Manager navigation (Dashboard / Organisations / Requests). Group A's Users, Activity
    // and Profile entries had no pages or backend and are intentionally not shown (see INTEGRATION_AUDIT.md).
    if (isPlatformManager) return [
      { to: '/platform', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/platform/organisations', label: 'Organisations', icon: Building2 },
      { to: '/platform/requests', label: 'Requests', icon: ClipboardList },
    ];
    // Group B's Organisation Admin navigation: the Dashboard (/manage) is the single entry point and consolidates
    // Library management, Materials and Members, which are reached from it. Catalogue and Upload stay.
    if (isOrgAdmin) return [
      { to: '/manage', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/catalogue', label: 'Catalogue', icon: Library },
      { to: '/manage/materials', label: 'Materials', icon: FolderOpen },
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
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:gap-6 lg:px-8 lg:py-4">
          <Link to={homePath} className="flex shrink-0 items-center gap-3 no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white"><BookOpen size={23}/></span>
            <span className="text-2xl font-semibold tracking-tight text-deep">LORIS</span>
          </Link>
          {/* Desktop: full navigation bar */}
          <nav aria-label="Global navigation" className="ml-auto hidden flex-1 flex-wrap items-center justify-end gap-2 lg:flex">
            {items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold no-underline transition ${isActive ? 'bg-ink text-white' : 'text-brand-text hover:bg-mint'}`}>
              <Icon size={17}/>{label}
            </NavLink>)}
          </nav>
          <button onClick={() => void signOut()} className="hidden shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-brand-text hover:bg-mint lg:inline-flex"><LogOut size={16}/> Sign out</button>
          {/* Mobile / tablet: hamburger */}
          <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-deep lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {menuOpen && <div className="max-h-[calc(100vh-65px)] overflow-y-auto border-t border-line bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold no-underline transition ${isActive ? 'bg-ink text-white' : 'text-brand-text hover:bg-mint'}`}>
              <Icon size={19}/>{label}
            </NavLink>)}
          </nav>
          <button onClick={() => void signOut()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-3 text-base text-brand-text hover:bg-mint"><LogOut size={18}/> Sign out</button>
        </div>}
      </header>
      <main className="min-h-[calc(100vh-73px)]"><Outlet /></main>
    </div>
    {!isPlatformManager && !isOrgAdmin && <AssistantWidget />}
  </AssistantProvider>;
}

/** Public chrome for visitors browsing the catalogue without an account (same bar as the landing page). */
function GuestLayout() {
  return <div className="min-h-screen bg-page text-deep">
    <PublicHeader />
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
