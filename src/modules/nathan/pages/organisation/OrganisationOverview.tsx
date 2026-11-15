import { AsyncView } from '../../components/common/AsyncView';
import { Panel } from '../../components/common/Panel';
import { Button, SectionHeader, StatDisplay } from '../../components/shared';
import { useAsync } from '../../hooks/useAsync';
import { ROUTES } from '../../routes/paths';
import { getDashboard } from '../../services/organisation.service';
import { formatNumber } from '../../utils/format';

/** Organisation home: headline numbers and a way into each space. */
export function OrganisationOverview() {
  const { data, loading, error, reload } = useAsync(getDashboard, []);

  return (
    <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading your dashboard…">
      {(d) => {
        const spaces = [
          { id: 'users', title: 'Manage users', meta: `${formatNumber(d.members.total)} users · ${formatNumber(d.members.online)} online`, description: 'See your community, search for people and remove access when someone leaves.', to: ROUTES.organisationUsers, cta: 'Go to users' },
          { id: 'invitations', title: 'Invitation codes', meta: `${formatNumber(d.pendingInvitations)} email invitations pending`, description: 'Invite people by email or link, and create codes new members join with.', to: ROUTES.organisationInvitations, cta: 'Go to invitations' },
          { id: 'renewals', title: 'Renewal requests', meta: 'Keep your access going', description: 'Ask the platform team to extend your organisation’s access and follow the reply.', to: ROUTES.organisationRenewals, cta: 'Go to renewals' },
          { id: 'tickets', title: 'Support tickets', meta: 'Help when you need it', description: 'Contact the platform team about a problem and keep every conversation in one place.', to: ROUTES.organisationTickets, cta: 'Go to support' },
        ];
        return (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Panel className="p-5"><StatDisplay label="Total users" value={formatNumber(d.members.total)} supporting="Users with library access" /></Panel>
              <Panel className="p-5"><StatDisplay label="Online now" value={formatNumber(d.members.online)} supporting="Users currently online" /></Panel>
              <Panel className="p-5"><StatDisplay label="Active users" value={formatNumber(d.members.activeLast30Days)} supporting="Active in the last 30 days" /></Panel>
              <Panel className="p-5"><StatDisplay label="Pending invitations" value={formatNumber(d.pendingInvitations)} supporting="Emails not yet accepted" /></Panel>
            </div>

            <section aria-labelledby="spaces" className="space-y-4">
              <SectionHeader title={<span id="spaces">Your organisation spaces</span>} />
              <div className="grid gap-4 md:grid-cols-2">
                {spaces.map((s) => (
                  <Panel key={s.id} as="article" className="flex flex-col p-6" aria-labelledby={`space-${s.id}`}>
                    <SectionHeader as="h3" title={<span id={`space-${s.id}`}>{s.title}</span>} description={s.meta} />
                    <p className="mt-3 flex-1 text-[16px] leading-6 text-ink/80">{s.description}</p>
                    <div className="mt-5"><Button to={s.to} variant="outline" size="sm">{s.cta}</Button></div>
                  </Panel>
                ))}
              </div>
            </section>
          </div>
        );
      }}
    </AsyncView>
  );
}
