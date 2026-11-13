import { ExternalLink } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button, NavigationItem, PageHeader, Topbar } from '../shared';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../routes/paths';
import { shortOrgName } from '../../utils/format';
import { AccountControls } from './AccountControls';
import { AppFooter } from './AppFooter';
import { BrandMark } from './BrandMark';

/** Shell for organisation administrators. */
export function OrganisationLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const org = shortOrgName(user?.organisationName);
  const crumb = (page: string) => `${org}'s library / ${page}`;

  const header =
    pathname.startsWith('/organisation/upload') ? { eyebrow: crumb('Upload'), title: 'Grow your collection', description: 'Share books, videos, images and audio. Put every discovery in the right category.' }
    : pathname.startsWith('/organisation/materials') ? { eyebrow: crumb('Materials'), title: 'Your collection managed', description: 'Keep materials up to date and see what your community values most.' }
    : pathname.startsWith('/organisation/members') ? { eyebrow: crumb('Members'), title: 'Your community', description: 'See who is here, invite new members and manage access to your organisation.' }
    : { eyebrow: 'A space for curious minds', title: `${org}'s dashboard`, description: 'Your library and community at a glance. Explore each space for the details.' };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        sticky
        brand={<BrandMark to={ROUTES.organisation} />}
        navigation={
          <>
            <NavigationItem label="Overview" to={ROUTES.organisation} end className="px-3" />
            <NavigationItem label="Upload materials" to="/organisation/upload" className="px-3" />
            <NavigationItem label="Materials" to="/organisation/materials" className="px-3" />
            <NavigationItem label="Members" to="/organisation/members" className="px-3" />
          </>
        }
        actions={<Button to={ROUTES.library} variant="outline" size="sm" rightIcon={<ExternalLink size={14} aria-hidden />}>View library</Button>}
        userControls={<AccountControls />}
      />
      <PageHeader tone="dark" size="md" eyebrow={header.eyebrow} title={header.title} description={header.description} className="px-8 py-10" />
      <main className="mx-auto w-full max-w-[1312px] flex-1 px-8 py-8"><Outlet /></main>
      <AppFooter left="© 2026 Loris Web Library. A shared space for curious minds." />
    </div>
  );
}
