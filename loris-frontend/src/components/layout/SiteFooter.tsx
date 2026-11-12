import { LorisLogo } from '../common/LorisLogo';

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-white">
      <div className="mx-auto max-w-[1312px] px-8 pb-8 pt-10">
        <LorisLogo />
        <p className="mt-4 font-serif text-[15px] italic text-ink">A shared space for a curious world.</p>
        <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-muted">
          Preserving knowledge, archival treasures, and academic journals across all classical and contemporary
          mediums.
        </p>
        <div className="mt-10 flex items-center justify-between rounded-xl bg-mint px-6 py-4 text-[11px] text-ink/70">
          <span>© {new Date().getFullYear()} LORIS. All rights reserved.</span>
          <span className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Archival Use</span>
            <span>Licensing &amp; Attribution</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
