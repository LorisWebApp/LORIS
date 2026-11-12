import { BookOpen, Compass, Download, Inbox, Library, Settings, Trash2, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Alert, Breadcrumbs, Button, ConfirmationDialog, DataTable, DetailRow, EmptyState, ErrorState, FilterDropdown,
  LoadingIndicator, MaterialItem, MaterialList, MaterialMetadata, Modal, NavigationItem, NotificationPanel, OfflineIndicator,
  PageHeader, Pagination, ProgressIndicator, SearchBar, SectionHeader, Sidebar, StatDisplay, StatusBadge, TabNavigation,
  ToastNotification, Topbar, UserAvatar, UserMenu,
  type ButtonVariant, type NotificationItem, type SidebarSection, type SortState, type StatusVariant,
} from '../../components/shared';

/* ---- Mock data: used for this showcase only. Not part of any component. ---- */
const sampleNotifications: NotificationItem[] = [
  { id: '1', title: 'Download complete', description: '“The Art of Paying Attention” is ready offline.', time: '2m ago', status: 'success' },
  { id: '2', title: 'Offline access expires soon', description: '3 materials expire within 48 hours.', time: '1h ago', status: 'warning' },
  { id: '3', title: 'Sync conflict', description: 'A note on “Beneath the Blue” needs review.', time: 'Yesterday', status: 'error', read: true },
  { id: '4', title: 'New collection added', time: '2d ago', status: 'info', read: true },
];
const sidebarSections: SidebarSection[] = [
  { id: 'main', title: 'Library', entries: [
    { id: 'browse', label: 'Browse', to: '/showcase#browse', icon: <Compass size={18} />, active: true },
    { id: 'mine', label: 'My Library', to: '/showcase#mine', icon: <Library size={18} /> },
  ] },
  { id: 'manage', title: 'Management', roles: ['librarian', 'admin'], entries: [
    { id: 'catalogue', label: 'Catalogue', to: '/showcase#catalogue', icon: <BookOpen size={18} />, badge: 12 },
    { id: 'users', label: 'Members', to: '/showcase#users', icon: <Users size={18} />, roles: ['admin'] },
    { id: 'settings', label: 'Organisation', to: '/showcase#org', icon: <Settings size={18} />, roles: ['admin'] },
  ] },
];
const tableRows = [
  { id: 'a', title: 'Beneath the Blue', author: 'Dr. Maya Chan', status: 'Published', size: '45.2 MB' },
  { id: 'b', title: 'A Map of Elsewhere', author: 'Oliver Hayes', status: 'In review', size: '24.1 MB' },
  { id: 'c', title: 'Cities for Tomorrow', author: 'Atlas Studio', status: 'Withdrawn', size: '480 MB' },
];
const badgeVariants: StatusVariant[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const cover = (c1: string, c2: string, t: string) => (
  <div className="flex size-full items-center justify-center p-3 text-center text-[20px] text-white/90" style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>{t}</div>
);

function Demo({ title, note, code, children }: { title: string; note?: string; code: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-8">
      <h3 className="m-0 text-[22px] font-semibold text-deep">{title}</h3>
      {note && <p className="mt-1 max-w-2xl text-[16px] text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
      <pre className="mt-5 overflow-x-auto bg-deep p-4 text-[13px] leading-5 text-white/85"><code>{code}</code></pre>
    </div>
  );
}
const Label = ({ children }: { children: ReactNode }) => <p className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted first:mt-0">{children}</p>;

export default function ComponentShowcase() {
  const [role, setRole] = useState('member');
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<'success' | 'error' | 'warning' | 'info' | null>(null);
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(10);
  const [tab, setTab] = useState('all');
  const [pillTab, setPillTab] = useState('epub');
  const [sort, setSort] = useState<SortState>({ key: 'title', direction: 'asc' });
  const [filterOne, setFilterOne] = useState('recent');
  const [filterMany, setFilterMany] = useState<string[]>(['epub']);
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(true);
  const [notes, setNotes] = useState(sampleNotifications);

  const sortedRows = [...tableRows].sort((a, b) => {
    const k = sort.key as keyof (typeof tableRows)[number];
    return String(a[k]).localeCompare(String(b[k])) * (sort.direction === 'asc' ? 1 : -1);
  });
  const variants: Exclude<ButtonVariant, 'icon'>[] = ['primary', 'secondary', 'outline', 'text', 'danger'];

  return (
    <div className="min-h-screen bg-white">
      <PageHeader tone="dark" size="lg" accent className="pb-14 pt-12" contentClassName="px-8"
        breadcrumbs={[{ label: 'LORIS' }, { label: 'Shared components' }]} title="Component library"
        description="Reusable building blocks for Groups A–D. Every example below is live; code shows the minimum usage." />
      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-10">

        <SectionHeader title="Typography" description="Newsreader throughout. Hierarchy comes from size, weight and case." />
        <div className="mt-6 space-y-3">
          <p className="m-0 text-[56px] font-medium leading-none tracking-tight text-deep">Page heading</p>
          <p className="m-0 text-[30px] font-medium leading-tight text-deep">Section heading</p>
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Component label</p>
          <p className="m-0 max-w-xl text-[17px] leading-7 text-deep">Body text sets the reading rhythm for descriptions, answers and metadata across the library.</p>
          <p className="m-0 text-[15px] text-muted">Supporting information — dates, counts, hints.</p>
        </div>

        {/* ---------------- Navigation ---------------- */}
        <div className="mt-14"><SectionHeader title="1 · Navigation" /></div>
        <Demo title="NavigationItem" note="Four variants; the active state is derived from the route, or set explicitly with active."
          code={`<NavigationItem to="/browse" label="Browse" icon={<Compass size={18} />} variant="sidebar" />\n// variants: underline | pill | sidebar | bottom`}>
          <div className="flex flex-wrap items-end gap-10">
            <div className="flex gap-6"><NavigationItem label="Browse" variant="underline" active /><NavigationItem label="My library" variant="underline" /></div>
            <div className="flex gap-1 rounded-full bg-mint p-1"><NavigationItem label="Offline" variant="pill" active /><NavigationItem label="Assistant" variant="pill" /></div>
            <div className="w-52"><NavigationItem label="Catalogue" variant="sidebar" icon={<BookOpen size={18} />} active badge={12} /><NavigationItem label="Members" variant="sidebar" icon={<Users size={18} />} /></div>
            <div className="flex gap-6"><NavigationItem label="Browse" variant="bottom" icon={<Compass size={18} />} active /><NavigationItem label="Offline" variant="bottom" icon={<Library size={18} />} /></div>
          </div>
        </Demo>
        <Demo title="Sidebar" note="Entries and sections can be restricted with roles; pass the current user's role."
          code={`<Sidebar role={user.role} sections={sections} brand={<Logo />} />\n// section/entry: { id, label, to, icon, badge, roles?: ['admin'] }`}>
          <TabNavigation aria-label="Preview role" tabs={['member', 'librarian', 'admin'].map((r) => ({ id: r, label: r }))} activeId={role} onChange={setRole} className="mb-5" />
          <div className="h-[330px] w-[260px] border border-line"><Sidebar role={role} sections={sidebarSections} brand={<span className="text-[22px] font-semibold text-deep">LORIS</span>} /></div>
        </Demo>
        <Demo title="Topbar" note="Slots for brand, navigation, page actions and user controls."
          code={`<Topbar brand={<Logo />} navigation={...} actions={<Button>New</Button>}\n  userControls={<><NotificationPanel .../><UserMenu .../></>} />`}>
          <div className="overflow-x-auto"><div className="min-w-[680px] border border-line">
            <Topbar brand={<span className="text-[20px] font-semibold">LORIS</span>}
              navigation={<><NavigationItem label="Browse" active /><NavigationItem label="My library" /></>}
              actions={<Button size="sm" leftIcon={<Download size={14} />}>Save offline</Button>}
              userControls={<><NotificationPanel notifications={sampleNotifications} /><UserMenu user={{ name: 'Jane Lee', email: 'jane@atlas.edu' }} items={[{ label: 'Profile' }]} /></>} />
          </div></div>
        </Demo>
        <Demo title="Breadcrumbs" code={`<Breadcrumbs items={[{ label: 'Library', to: '/' }, { label: 'Offline Library' }]} />`}>
          <Breadcrumbs items={[{ label: 'Library', to: '/' }, { label: 'Science & Nature', to: '/' }, { label: 'Beneath the Blue' }]} />
          <div className="mt-4 bg-ink p-4"><Breadcrumbs tone="inverse" items={[{ label: 'Admin', to: '/' }, { label: 'Organisations' }]} /></div>
        </Demo>
        <Demo title="PageHeader" code={`<PageHeader title="Members" description="…" breadcrumbs={[…]} actions={<Button>Invite</Button>} tone="light" size="md" />`}>
          <PageHeader title="Members" size="md" description="Manage who can access your organisation’s library." breadcrumbs={[{ label: 'Admin', to: '/' }, { label: 'Members' }]} actions={<Button>Invite member</Button>} />
          <div className="mt-6"><PageHeader tone="dark" size="sm" className="p-6" title="Offline Library" description="Read without connection" /></div>
        </Demo>
        <Demo title="UserMenu" note="Configurable items, dividers and tones. Open it, then try ↑ ↓ and Esc."
          code={`<UserMenu user={{ name, email, initials }} items={[{ label: 'Profile', to: '/me' }, { divider: true }, { label: 'Sign out', tone: 'danger', onClick }]} />`}>
          <div className="flex h-56 justify-end"><UserMenu user={{ name: 'Jane Lee', email: 'jane@atlas.edu' }} items={[{ label: 'Profile', to: '/showcase' }, { label: 'Settings', icon: <Settings size={16} /> }, { divider: true }, { label: 'Sign out', tone: 'danger' }]} /></div>
        </Demo>
        <Demo title="NotificationPanel" note="Statuses: info, success, warning, error. Unread items show a dot and bold text."
          code={`<NotificationPanel notifications={items} onMarkAllRead={…} onNotificationClick={…} onDismiss={…} />`}>
          <div className="flex h-96 justify-end"><NotificationPanel notifications={notes}
            onMarkAllRead={() => setNotes((n) => n.map((x) => ({ ...x, read: true })))}
            onNotificationClick={(n) => setNotes((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
            onDismiss={(n) => setNotes((l) => l.filter((x) => x.id !== n.id))} /></div>
        </Demo>

        {/* ---------------- Buttons ---------------- */}
        <div className="mt-14"><SectionHeader title="2 · Buttons" /></div>
        <Demo title="Button" note="One component. Variants × states; sizes sm / md / lg; to renders a router link; tone='inverse' for dark surfaces."
          code={`<Button variant="primary" leftIcon={<Download size={16}/>} onClick={save}>Save offline</Button>\n<Button variant="icon" aria-label="Remove"><Trash2 size={16}/></Button>\n<Button loading>Saving…</Button>   <Button disabled>Unavailable</Button>`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-[15px]"><thead><tr className="text-[13px] uppercase tracking-[0.12em] text-muted"><th className="pb-2">Variant</th><th>Default</th><th>Disabled</th><th>Loading</th><th>With icon</th></tr></thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v} className="border-t border-line"><td className="py-3 font-semibold text-deep">{v}</td>
                  <td><Button variant={v}>Label</Button></td><td><Button variant={v} disabled>Label</Button></td><td><Button variant={v} loading>Label</Button></td>
                  <td><Button variant={v} leftIcon={<Download size={16} />}>Label</Button></td></tr>
              ))}
              <tr className="border-t border-line"><td className="py-3 font-semibold text-deep">icon</td>
                <td><Button variant="icon" aria-label="Remove"><Trash2 size={16} /></Button></td><td><Button variant="icon" aria-label="Remove" disabled><Trash2 size={16} /></Button></td><td><Button variant="icon" aria-label="Loading" loading /></td><td><Button variant="icon" filled aria-label="Download"><Download size={16} /></Button> <span className="text-muted">filled</span></td></tr>
            </tbody></table></div>
          <Label>Sizes</Label><div className="flex flex-wrap items-center gap-3"><Button size="sm">Small</Button><Button size="md">Medium</Button><Button size="lg">Large</Button><Button shape="pill">Pill shape</Button></div>
          <Label>Inverse (dark surfaces)</Label><div className="flex flex-wrap gap-3 bg-ink p-4"><Button tone="inverse">Primary</Button><Button tone="inverse" variant="secondary">Secondary</Button><Button tone="inverse" variant="outline">Outline</Button><Button tone="inverse" variant="text">Text</Button></div>
        </Demo>

        {/* ---------------- Feedback ---------------- */}
        <div className="mt-14"><SectionHeader title="3 · Feedback" /></div>
        <Demo title="ToastNotification" note="Auto-dismisses after duration (default 5s). Fixed to the viewport unless placement='inline'."
          code={`<ToastNotification open={!!toast} variant="success" message="Saved offline" onClose={() => setToast(null)} />`}>
          <div className="flex flex-wrap gap-2">{(['success', 'error', 'warning', 'info'] as const).map((v) => <Button key={v} variant="outline" size="sm" onClick={() => setToast(v)}>Show {v}</Button>)}</div>
          <div className="mt-5 space-y-3">{(['success', 'error', 'warning', 'info'] as const).map((v) => <ToastNotification key={v} placement="inline" variant={v} duration={0} title={v[0].toUpperCase() + v.slice(1)} message="This is how the message reads." onClose={() => undefined} />)}</div>
          <ToastNotification open={toast !== null} variant={toast ?? 'info'} message={`A ${toast} notification`} onClose={() => setToast(null)} />
        </Demo>
        <Demo title="Alert" code={`<Alert severity="warning" title="Offline access expires" action={<Button variant="text" size="sm">Renew</Button>}>…</Alert>`}>
          <div className="space-y-4">
            <Alert severity="info" title="Information">Your library syncs automatically when you reconnect.</Alert>
            <Alert severity="success" title="Success">Saved to this device.</Alert>
            <Alert severity="warning" title="Warning" action={<Button variant="text" size="sm">Renew access</Button>}>Three materials expire within 48 hours.</Alert>
            <Alert severity="error" title="Error" onDismiss={() => undefined}>The file could not be downloaded.</Alert>
          </div>
        </Demo>
        <Demo title="Modal and ConfirmationDialog" note="Focus is trapped; Escape closes; focus returns to the trigger."
          code={`<ConfirmationDialog open={open} tone="danger" title="Remove?" description="…" confirmLabel="Remove" onConfirm={…} onCancel={…} />\n<Modal open title="Details" actions={<Button>Done</Button>}>…content…</Modal>`}>
          <div className="flex gap-3"><Button variant="outline" onClick={() => setModal(true)}>Open modal</Button><Button variant="danger" onClick={() => setConfirm(true)}>Open confirmation</Button></div>
          <Modal open={modal} onClose={() => setModal(false)} title="Material details" description="Any content can be placed in a modal." actions={<><Button variant="text" onClick={() => setModal(false)}>Close</Button><Button onClick={() => setModal(false)}>Done</Button></>}>
            <dl className="m-0"><DetailRow label="Format" value="EPUB" divider /><DetailRow label="Size" value="18.4 MB" /></dl>
          </Modal>
          <ConfirmationDialog open={confirm} tone="danger" title="Remove from this device?" description="The file will be deleted from offline storage." confirmLabel="Remove" onCancel={() => setConfirm(false)} onConfirm={() => setConfirm(false)} />
        </Demo>
        <Demo title="LoadingIndicator" code={`<LoadingIndicator size="lg" label="Loading library…" centered />`}>
          <div className="flex flex-wrap items-center gap-10"><LoadingIndicator size="sm" /><LoadingIndicator size="md" label="Syncing…" /><LoadingIndicator size="lg" /></div>
        </Demo>
        <Demo title="EmptyState and ErrorState" code={`<EmptyState icon={<Inbox size={28}/>} title="Nothing here" description="…" action={<Button>Browse</Button>} />\n<ErrorState message="…" onRetry={reload} />`}>
          <div className="grid gap-6 md:grid-cols-2"><div className="border border-line"><EmptyState icon={<Inbox size={28} />} title="Nothing saved yet" description="Saved materials will appear here." action={<Button>Explore catalogue</Button>} /></div>
            <div className="border border-line"><ErrorState message="We couldn’t reach the server. Check your connection." onRetry={() => undefined} /></div></div>
        </Demo>
        <Demo title="OfflineIndicator" code={`<OfflineIndicator isOnline={isOnline} variant="dot" />   // dot | badge | banner`}>
          <Button size="sm" variant="outline" onClick={() => setOnline((o) => !o)}>Toggle connection</Button>
          <div className="mt-4 flex flex-wrap items-center gap-8"><OfflineIndicator isOnline={online} variant="dot" /><OfflineIndicator isOnline={online} variant="badge" /></div>
          <div className="mt-3"><OfflineIndicator isOnline={online} variant="banner" description="Changes will sync when you reconnect." />{online && <p className="text-[14px] text-muted">The banner renders only while offline.</p>}</div>
        </Demo>

        {/* ---------------- Data display ---------------- */}
        <div className="mt-14"><SectionHeader title="4 · Data display" /></div>
        <Demo title="DataTable" note="Configurable columns, custom cells, sorting, loading and empty states."
          code={`<DataTable caption="Catalogue" columns={[{ key: 'title', header: 'Title', sortable: true }, …]} rows={rows} getRowKey={(r) => r.id}\n  sort={sort} onSortChange={setSort} loading={loading} emptyState={<EmptyState … />} />`}>
          <DataTable caption="Sample catalogue" getRowKey={(r) => r.id} rows={sortedRows} sort={sort} onSortChange={setSort}
            columns={[{ key: 'title', header: 'Title', sortable: true }, { key: 'author', header: 'Author', sortable: true },
              { key: 'status', header: 'Status', cell: (r) => <StatusBadge label={r.status} size="sm" variant={r.status === 'Published' ? 'success' : r.status === 'In review' ? 'warning' : 'danger'} dot /> },
              { key: 'size', header: 'Size', align: 'right' }]} />
          <Label>Loading</Label><DataTable caption="Loading" getRowKey={() => ''} rows={[]} loading loadingRows={2} columns={[{ key: 'a', header: 'Title' }, { key: 'b', header: 'Author' }]} />
          <Label>Empty</Label><DataTable caption="Empty" getRowKey={() => ''} rows={[]} columns={[{ key: 'a', header: 'Title' }, { key: 'b', header: 'Author' }]} emptyState={<EmptyState title="No results" description="Try a different filter." />} />
        </Demo>
        <Demo title="StatusBadge" code={`<StatusBadge label="Published" variant="success" dot />`}>
          <div className="flex flex-wrap items-center gap-3">{badgeVariants.map((v) => <StatusBadge key={v} label={v} variant={v} />)}<StatusBadge label="with dot" variant="success" dot /><StatusBadge label="small" size="sm" variant="accent" /></div>
        </Demo>
        <Demo title="Pagination" code={`<Pagination page={page} totalItems={240} pageSize={size} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={setSize} />`}>
          <Pagination page={page} totalItems={240} pageSize={size} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={(n) => { setSize(n); setPage(1); }} />
        </Demo>
        <Demo title="SearchBar" code={`<SearchBar placeholder="Search the catalogue" onSearch={run} debounceMs={300} appearance="line" />`}>
          <div className="grid gap-5 md:grid-cols-2"><SearchBar placeholder="Search the catalogue" value={query} onChange={setQuery} onSearch={() => undefined} />
            <SearchBar appearance="filled" placeholder="Filled" /><SearchBar appearance="pill" placeholder="Pill" /><div className="bg-page p-3"><SearchBar appearance="raised" placeholder="Raised (on tinted pages)" /></div></div>
        </Demo>
        <Demo title="FilterDropdown" code={`<FilterDropdown label="Format" multiple options={opts} value={vals} onChange={setVals} />`}>
          <div className="flex h-60 flex-wrap gap-10"><FilterDropdown label="Sort" value={filterOne} onChange={setFilterOne} options={[{ value: 'recent', label: 'Recently saved' }, { value: 'title', label: 'Title A–Z' }, { value: 'size', label: 'Largest first' }]} />
            <FilterDropdown label="Format" multiple value={filterMany} onChange={setFilterMany} options={[{ value: 'epub', label: 'E-Books', count: 2 }, { value: 'pdf', label: 'Documents', count: 2 }, { value: 'mp3', label: 'Audio', count: 1 }]} /></div>
        </Demo>
        <Demo title="DetailRow and StatDisplay" code={`<DetailRow label="Format" value="EPUB" divider />\n<StatDisplay label="Items saved" value="6" supporting="of 50 allowed" />`}>
          <div className="grid gap-10 md:grid-cols-2">
            <dl className="m-0"><DetailRow label="Format" value="EPUB" divider /><DetailRow label="Size" value="18.4 MB" divider /><DetailRow layout="stacked" label="Author" value="Elena Rivers" /></dl>
            <div className="flex flex-wrap gap-12"><StatDisplay label="Items saved" value="6" supporting="of 50 allowed" /><StatDisplay label="Storage" value="1.42" unit="GB / 5.0 GB" supporting="28.4% capacity" /></div>
          </div>
          <div className="mt-6 bg-ink p-6"><StatDisplay tone="inverse" size="lg" label="Vault volume" value="1.42" unit="GB" supporting="28.4% capacity" /></div>
        </Demo>

        {/* ---------------- Content ---------------- */}
        <div className="mt-14"><SectionHeader title="5 · Content" /></div>
        <Demo title="MaterialItem and MaterialList" note="Three layouts: card (grid), row (list), compact (mobile). Cover, status and actions are slots."
          code={`<MaterialList layout="grid" columns={3} materials={[{ id, title, subtitle, cover, tag: { label: 'EPUB' }, details: ['248 pages'], status, actions }]} />`}>
          <MaterialList layout="grid" columns={3} framed aria-label="Sample materials" materials={[
            { id: '1', title: 'The Art of Paying Attention', subtitle: 'Elena Rivers', cover: cover('#3b5d56', '#a9c4bb', 'Attention'), tag: { label: 'EPUB' }, details: ['248 pages', '18.4 MB'], status: <span className="font-semibold text-brand">Available offline</span>, actions: <><Button className="flex-1" leftIcon={<BookOpen size={14} />}>Read</Button><Button variant="icon" aria-label="Remove"><Trash2 size={15} /></Button></> },
            { id: '2', title: 'Beneath the Blue', subtitle: 'Dr. Maya Chan', cover: cover('#0e3a57', '#38a3b8', 'The Blue'), tag: { label: 'PDF', variant: 'danger' }, details: ['186 pages', '45.2 MB'], metadata: { category: 'Science & Nature', publishedAt: '2023' }, actions: <Button className="flex-1" variant="outline">Open document</Button> },
          ]} />
          <Label>Row layout</Label>
          <MaterialList layout="list" aria-label="Rows" materials={[{ id: 'r', title: 'A Map of Elsewhere', subtitle: 'Oliver Hayes', cover: cover('#4d6b45', '#c9d9a8', 'Map'), tag: { label: 'EPUB' }, details: ['312 pages'], aside: 'Page 42 of 312', actions: <Button variant="outline" size="sm">Read</Button> }]} />
          <Label>Compact layout</Label>
          <div className="max-w-sm bg-page p-3"><MaterialList layout="compact" framed aria-label="Compact" materials={[{ id: 'c', title: 'The Living Forest', subtitle: 'Sofia Laurent', cover: cover('#6b5a3e', '#e3d3b0', 'Forest'), tag: { label: 'MP3' }, details: ['5 hr 24 min'], status: <span className="font-semibold text-brand">Available offline</span>, statusAside: 'Saved 1w ago', aside: 'Ch. 3', actions: <Button className="flex-1">Listen</Button> }]} /></div>
          <Label>Loading and empty</Label>
          <div className="grid gap-6 md:grid-cols-2"><MaterialList materials={[]} loading /><MaterialList materials={[]} emptyState={<EmptyState title="No materials" />} /></div>
          <MaterialItem layout="row" title="Standalone item" cover={cover('#2c3e5f', '#9db4d6', 'Solo')} className="mt-4" />
        </Demo>
        <Demo title="MaterialMetadata" code={`<MaterialMetadata author="Elena Rivers" publishedAt="2024-03-02" fileType="EPUB" category="Personal Growth" layout="stacked" />`}>
          <div className="grid gap-8 md:grid-cols-2"><MaterialMetadata author="Elena Rivers" publishedAt="2024" fileType="EPUB" category="Personal Growth" fileSize="18.4 MB" />
            <MaterialMetadata layout="stacked" author="Elena Rivers" publishedAt="2024-03-02" fileType="EPUB" category="Personal Growth" items={[{ label: 'Pages', value: '248' }]} /></div>
        </Demo>
        <Demo title="SectionHeader" code={`<SectionHeader title="Recently saved" description="…" actions={<Button variant="text">View all</Button>} />`}>
          <SectionHeader eyebrow="Library" title="Recently saved" description="Items you downloaded this week." actions={<Button variant="text">View all</Button>} divider />
          <div className="mt-6 max-w-xs"><SectionHeader size="sm" as="h3" title="Vault filters" actions={<Button variant="text" size="sm">Reset</Button>} /></div>
        </Demo>
        <Demo title="TabNavigation" code={`<TabNavigation aria-label="Format" tabs={[{ id: 'all', label: 'All', count: 6 }]} activeId={tab} onChange={setTab} variant="underline" />`}>
          <TabNavigation aria-label="Underline tabs" activeId={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: 6 }, { id: 'epub', label: 'E-Books', count: 2 }, { id: 'pdf', label: 'Documents', count: 2 }, { id: 'x', label: 'Disabled', disabled: true }]} />
          <div className="mt-6"><TabNavigation aria-label="Pill tabs" variant="pill" activeId={pillTab} onChange={setPillTab} tabs={[{ id: 'all', label: 'All', count: 6 }, { id: 'epub', label: 'E-Books', count: 2 }, { id: 'pdf', label: 'Documents', count: 2 }]} /></div>
        </Demo>
        <Demo title="ProgressIndicator" code={`<ProgressIndicator value={42} max={248} label="Reading progress" showValue />\n<ProgressIndicator segments={[{ value: 64, className: 'bg-brand' }, …]} max={5000} />`}>
          <div className="max-w-md space-y-6"><ProgressIndicator value={42} max={248} label="Reading progress" showValue="Page 42 of 248" /><ProgressIndicator value={75} label="Download" showValue size="sm" />
            <ProgressIndicator max={5000} label="Storage" showValue="1.42 GB" segments={[{ value: 640, className: 'bg-[#3f7f78]', label: 'EPUB' }, { value: 1200, className: 'bg-[#9ce0d3]', label: 'PDF' }, { value: 800, className: 'bg-deep', label: 'Media' }]} /></div>
        </Demo>
        <Demo title="UserAvatar" code={`<UserAvatar name="Jane Lee" size="md" />   <UserAvatar imageUrl={url} name="Jane Lee" />`}>
          <div className="flex flex-wrap items-center gap-5"><UserAvatar name="Jane Lee" size="xs" /><UserAvatar name="Jane Lee" size="sm" /><UserAvatar name="Jane Lee" size="md" /><UserAvatar name="Jane Lee" size="lg" /><UserAvatar initials="AB" tone="light" size="md" /><UserAvatar size="md" /><UserAvatar name="Broken image" imageUrl="/nope.png" size="md" /></div>
        </Demo>
      </main>
    </div>
  );
}
