import { useLocation } from 'react-router-dom';
import { allTabs } from '../../components/layouts/PlatformLayout';
import { EmptyState } from '../../components/shared';

/** Shown for navigation tabs whose screens have not been supplied yet. It makes no claim about data. */
export default function SectionUnavailable() {
  const { pathname } = useLocation();
  const label = allTabs.find((tab) => tab.to === pathname)?.label ?? 'This section';

  return (
    <main className="mx-auto max-w-[1312px] px-4 py-16 sm:px-8">
      <EmptyState title={label} description="This section is not available yet." />
    </main>
  );
}
