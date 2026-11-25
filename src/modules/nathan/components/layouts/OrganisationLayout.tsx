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
    pathname.startsWith(ROUTES.organisationUsers) ? { eyebrow: crumb('Users'), title: 'Your community', description: 'See who is here and manage access to your organisation.' }
    : pathname.startsWith(ROUTES.organisationInvitations) ? { eyebrow: crumb('Invitations'), title: 'Bring people in', description: 'Invite people by email or link, and manage the codes they join with.' }
    : pathname.startsWith(ROUTES.organisationRenewals) ? { eyebrow: crumb('Renewals'), title: 'Keep your library open', description: 'Ask for more time before your access ends and follow the reply.' }
    : pathname.startsWith(ROUTES.organisationTickets) ? { eyebrow: crumb('Support'), title: 'We are here to help', description: 'Contact the platform team and keep every conversation in one place.' }
    : { eyebrow: 'A space for curious minds', title: `${org}'s dashboard`, description: 'Your library and community at a glance. Explore each space for the details.' };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        sticky
        brand={<BrandMark to={ROUTES.organisation} />}
        navigation={
          <>
            <NavigationItem label="Overview" to={ROUTES.organisation} end className="px-3" />
            <NavigationItem label="Manage users" to={ROUTES.organisationUsers} className="px-3" />
            <NavigationItem label="Invitation codes" to={ROUTES.organisationInvitations} className="px-3" />
            <NavigationItem label="Renewal requests" to={ROUTES.organisationRenewals} className="px-3" />
            <NavigationItem label="Support tickets" to={ROUTES.organisationTickets} className="px-3" />
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
