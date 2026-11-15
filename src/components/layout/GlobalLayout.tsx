import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, Users, Upload, Settings, WifiOff, Heart, NotebookPen, UserRound, LogOut } from 'lucide-react';
import { useAuth } from '../../modules/group-a/contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { AssistantProvider } from '../assistant/AssistantProvider';
import { AssistantWidget } from '../assistant/AssistantWidget';

type Membership = { organisation_id: number; role: 'admin' | 'end_user'; status: 'pending' | 'active' | 'suspended' };
type NavItem = { to: string; label: string; icon: typeof BookOpen; end?: boolean };

export function GlobalLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function loadMemberships() {
      if (!user || !profile) { setMemberships([]); setMembershipLoading(false); return; }
      const { data, error } = await supabase.from('Memberships')
        .select('organisation_id, role, status').eq('user_id', profile.id);
      if (active) {
        if (error) console.error('Could not load memberships:', error.message);
        setMemberships((data ?? []) as Membership[]);
        setMembershipLoading(false);
      }
    }
    setMembershipLoading(true);
    void loadMemberships();
    return () => { active = false; };
  }, [user?.id, profile?.id]);

  if (loading || membershipLoading) return <div className="min-h-screen grid place-items-center bg-page text-deep">Loading LORIS…</div>;
  if (!user) return <Navigate to="/personal/login" replace state={{ from: location.pathname }} />;

  const isPlatformManager = profile?.platform_role === 'platform_manager';
  const activeMemberships = memberships.filter((m) => m.status === 'active');
  const isOrgAdmin = activeMemberships.some((m) => m.role === 'admin');
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
    <div className="min-h-screen bg-page text-deep">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-6 px-5 py-4 lg:px-8">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-3 no-underline">
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

export function RequireRole({ role, children }: { role: 'platform_manager' | 'admin' | 'end_user'; children: ReactNode }) {
  const { profile } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    async function check() {
      if (role === 'platform_manager') { if (active) setAllowed(profile?.platform_role === 'platform_manager'); return; }
      if (role === 'end_user') { if (active) setAllowed(profile?.platform_role === 'end_user'); return; }
      if (!profile) { if (active) setAllowed(false); return; }
      const { data, error } = await supabase.from('Memberships').select('id').eq('user_id', profile.id).eq('role','admin').eq('status','active').limit(1);
      if (active) setAllowed(!error && Boolean(data?.length));
    }
    setAllowed(null); void check(); return () => { active = false; };
  }, [role, profile?.id, profile?.platform_role]);
  if (allowed === null) return <div className="min-h-screen grid place-items-center">Checking permissions…</div>;
  if (!allowed) return <div className="mx-auto max-w-xl p-12 text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-muted">Your account does not have permission to access this section.</p></div>;
  return <>{children}</>;
}
