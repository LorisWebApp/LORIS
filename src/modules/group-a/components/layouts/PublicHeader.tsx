import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpenText, Menu, X } from 'lucide-react'

type Item = { label: string; to?: string; href?: string }

/**
 * The public (signed-out) navigation: Home / Catalogue / About / Contact + Login / Get Started.
 * Used by the landing page and by the guest catalogue/material pages so visitors see the same bar everywhere.
 */
export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const onLanding = useLocation().pathname === '/'

  // On the landing page, Home/About/Contact are in-page anchors; elsewhere they route back to it.
  const nav: Item[] = onLanding
    ? [
        { label: 'Home', href: '#top' },
        { label: 'Catalogue', to: '/catalogue' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' },
      ]
    : [
        { label: 'Home', to: '/' },
        { label: 'Catalogue', to: '/catalogue' },
        { label: 'About', to: '/#about' },
        { label: 'Contact', to: '/#contact' },
      ]

  const link = (item: Item, cls: string, onClick?: () => void) =>
    item.to
      ? <Link key={item.label} to={item.to} onClick={onClick} className={cls}>{item.label}</Link>
      : <a key={item.label} href={item.href} onClick={onClick} className={cls}>{item.label}</a>

  const linkCls = 'text-sm font-semibold text-white/80 no-underline transition hover:text-white'
  const mobileCls = 'block rounded-lg px-3 py-3 text-base font-semibold text-white/90 no-underline hover:bg-white/10'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="no-underline">
          <span className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-ink"><BookOpenText size={21} strokeWidth={1.8} /></span>
            <span className="font-serif text-2xl tracking-wide text-white">LORIS</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((n) => link(n, linkCls))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="px-3 py-2 text-sm font-semibold text-white no-underline hover:text-badge">Login</Link>
          <Link to="/register" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink no-underline transition hover:bg-badge">Get Started</Link>
        </div>
        <button className="text-white md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-5 pb-5 pt-3 md:hidden">
          {nav.map((n) => link(n, mobileCls, () => setOpen(false)))}
          <Link to="/login" onClick={() => setOpen(false)} className={mobileCls}>Login</Link>
          <Link to="/register" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-white px-3 py-3 text-center text-base font-semibold text-ink no-underline">Get Started</Link>
        </div>
      )}
    </header>
  )
}
