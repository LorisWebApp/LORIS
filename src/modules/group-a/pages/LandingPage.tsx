import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, BookOpenText, Building2, Download, FileText, Headphones,
  Heart, Library, Menu, NotebookPen, Search, ShieldCheck, Upload, UserRound, Users, Video, WifiOff, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import bookshelf from '../assets/images/BookShelf.jpeg'

/* ---------- content ---------- */

const NAV = [
  { label: 'Home', href: '#top' },
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'About', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
]

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Library, title: 'Digital Library', text: 'Access and manage learning materials in one place.' },
  { icon: Building2, title: 'Organisation Management', text: 'Organisations can manage members and their learning resources.' },
  { icon: WifiOff, title: 'Offline Access', text: 'Download resources for access without an internet connection.' },
  { icon: Heart, title: 'Personal Library', text: 'Save favourites, notes and bookmarks for easy access.' },
]

const STEPS = [
  { n: '01', title: 'Discover', text: 'Browse available learning materials.' },
  { n: '02', title: 'Access', text: 'Sign in to access resources and personal library features.' },
  { n: '03', title: 'Learn Anywhere', text: 'Save supported materials for offline reading.' },
]

const ORG_POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: Library, text: 'Establish and manage your own digital library.' },
  { icon: Upload, text: 'Upload and organise educational materials.' },
  { icon: Users, text: 'Manage your members.' },
  { icon: ShieldCheck, text: 'Control access to your resources.' },
]

// Sample titles for the public preview. Swap for live data once the public catalogue endpoint is exposed.
const PREVIEW: { title: string; author: string; category: string; type: string; icon: LucideIcon; from: string; to: string }[] = [
  { title: 'The Art of Deep Learning', author: 'Maya Okonkwo', category: 'Science', type: 'Book', icon: BookOpen, from: '#0b7a63', to: '#092f2c' },
  { title: 'Design for Everyday Minds', author: 'Tom Hargreaves', category: 'Design', type: 'eBook', icon: FileText, from: '#1f6f78', to: '#05201e' },
  { title: 'Voices of the Savannah', author: 'Chanda Mwila', category: 'Literature', type: 'Audio', icon: Headphones, from: '#2f8f83', to: '#0f3d38' },
  { title: 'Foundations of Growth', author: 'Lena Fischer', category: 'Personal growth', type: 'Video', icon: Video, from: '#4aa595', to: '#0b3b36' },
]

const FOOTER_LINKS: { label: string; to?: string; href?: string }[] = [
  { label: 'Home', href: '#top' },
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'About', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
  { label: 'Login', to: '/personal/login' },
  { label: 'Register', to: '/personal/register' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

/* ---------- small pieces ---------- */

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`grid size-10 place-items-center rounded-xl ${light ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
        <BookOpenText size={21} strokeWidth={1.8} />
      </span>
      <span className={`font-serif text-2xl tracking-wide ${light ? 'text-white' : 'text-deep'}`}>LORIS</span>
    </span>
  )
}

type BtnProps = { children: ReactNode; to: string; variant?: 'light' | 'dark' | 'ghost' | 'outline'; icon?: boolean }
function Btn({ children, to, variant = 'dark', icon }: BtnProps) {
  const styles = {
    light: 'bg-white text-ink hover:bg-badge',
    dark: 'bg-ink text-white hover:bg-deep',
    ghost: 'border border-white/35 text-white hover:bg-white/10',
    outline: 'border border-ink/25 text-ink hover:bg-mint',
  }[variant]
  return (
    <Link to={to} className={`group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold no-underline transition ${styles}`}>
      {children}
      {icon && <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />}
    </Link>
  )
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${light ? 'text-badge' : 'text-brand'}`}>{children}</p>
}

/** Stylised preview of the LORIS library so the hero shows the product, not a stock photo. */
function PlatformVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2 border-b border-line bg-mint-soft px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#f2b8b5]" />
          <span className="size-2.5 rounded-full bg-[#f0dd9c]" />
          <span className="size-2.5 rounded-full bg-badge" />
          <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-muted">loris.app/catalogue</span>
        </div>
        <div className="flex">
          <aside className="hidden w-32 shrink-0 space-y-1.5 border-r border-line bg-mint-soft p-3 sm:block">
            {[['Catalogue', Library, true], ['My library', BookOpen, false], ['Favourites', Heart, false], ['Notes', NotebookPen, false], ['Offline', WifiOff, false]].map(([l, I, on]) => {
              const Icon = I as LucideIcon
              return (
                <div key={l as string} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold ${on ? 'bg-ink text-white' : 'text-brand-text'}`}>
                  <Icon size={13} />{l as string}
                </div>
              )
            })}
          </aside>
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted">
              <Search size={14} /> Search by title, author, or ISBN…
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {PREVIEW.slice(0, 3).map((b) => (
                <div key={b.title}>
                  <div className="aspect-[3/4] rounded-md p-2 text-white shadow-md" style={{ background: `linear-gradient(155deg, ${b.from}, ${b.to})` }}>
                    <p className="font-serif text-[11px] leading-tight">{b.title}</p>
                  </div>
                  <p className="mt-1.5 truncate text-[11px] font-semibold text-deep">{b.title}</p>
                  <p className="truncate text-[10px] text-muted">{b.author}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-mint p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-brand-text">
                <span>Continue reading</span><span>64%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white"><div className="h-full w-[64%] rounded-full bg-brand" /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl sm:-left-8">
        <span className="grid size-9 place-items-center rounded-lg bg-mint text-brand"><Download size={18} /></span>
        <div><p className="text-sm font-semibold text-deep">Saved offline</p><p className="text-xs text-muted">Ready without internet</p></div>
      </div>
    </div>
  )
}

/* ---------- page ---------- */

export default function LandingPage() {
  const [open, setOpen] = useState(false)

  const navLink = (item: { label: string; to?: string; href?: string }, cls: string, onClick?: () => void) =>
    item.to
      ? <Link key={item.label} to={item.to} onClick={onClick} className={cls}>{item.label}</Link>
      : <a key={item.label} href={item.href} onClick={onClick} className={cls}>{item.label}</a>

  const linkCls = 'text-sm font-semibold text-white/80 no-underline transition hover:text-white'

  return (
    <div id="top" className="min-h-screen scroll-smooth bg-page text-deep">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" className="no-underline"><Logo light /></a>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => navLink(n, linkCls))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/personal/login" className="px-3 py-2 text-sm font-semibold text-white no-underline hover:text-badge">Login</Link>
            <Link to="/personal/register" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink no-underline transition hover:bg-badge">Get Started</Link>
          </div>
          <button className="text-white md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-white/10 px-5 pb-5 pt-3 md:hidden">
            {NAV.map((n) => navLink(n, 'block rounded-lg px-3 py-3 text-base font-semibold text-white/90 no-underline hover:bg-white/10', () => setOpen(false)))}
            <Link to="/personal/login" className="block rounded-lg px-3 py-3 text-base font-semibold text-white/90 no-underline hover:bg-white/10">Login</Link>
            <Link to="/personal/register" className="mt-2 block rounded-lg bg-white px-3 py-3 text-center text-base font-semibold text-ink no-underline">Get Started</Link>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-deep text-white">
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-[0.22] mix-blend-luminosity lg:w-[58%]"
            style={{ backgroundImage: `url(${bookshelf})`, maskImage: 'linear-gradient(to right, transparent, black 60%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)' }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-deep via-deep/90 to-ink/70" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-28">
            <div>
              <Eyebrow light>Your next discovery starts here</Eyebrow>
              <h1 className="mt-5 font-serif text-[44px] leading-[1.05] sm:text-6xl lg:text-[68px]">
                Your Knowledge.<br />One Digital Library.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                Discover, organise and access educational resources through one centralised digital library platform designed for organisations and learners.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Btn to="/catalogue" variant="light" icon>Explore Catalogue</Btn>
                <Btn to="/personal/register" variant="ghost">Get Started</Btn>
              </div>
              <p className="mt-6 text-sm text-white/50">
                Popular: Novel <span className="mx-1.5">•</span> Science <span className="mx-1.5">•</span> Design <span className="mx-1.5">•</span> Personal growth
              </p>
            </div>
            <PlatformVisual />
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>What LORIS can do</Eyebrow>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Everything learning needs, in one place</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-line bg-white p-7 shadow-[0_2px_12px_rgba(9,47,44,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(9,47,44,0.25)]">
                <span className="grid size-12 place-items-center rounded-xl bg-mint text-brand"><Icon size={23} strokeWidth={1.8} /></span>
                <h3 className="mt-5 font-serif text-2xl">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-20 bg-mint py-20 lg:py-28">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Three simple steps</h2>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(9,47,44,0.05)]">
                  <span className="font-serif text-6xl text-badge">{s.n}</span>
                  <h3 className="mt-2 font-serif text-3xl">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOR ORGANISATIONS */}
        <section id="organisations" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12 lg:grid-cols-2 lg:p-16">
            <div>
              <Eyebrow light>For organisations</Eyebrow>
              <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Run your own digital library</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
                Schools, institutions and teams can bring their learning resources together and give members a single, secure place to read.
              </p>
              <div className="mt-8"><Btn to="/organisation-registration" variant="light" icon>Register Your Organisation</Btn></div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {ORG_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="grid size-10 place-items-center rounded-lg bg-badge/15 text-badge"><Icon size={20} /></span>
                  <p className="mt-4 leading-snug text-white/90">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CATALOGUE PREVIEW */}
        <section id="catalogue" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Catalogue preview</Eyebrow>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">A glimpse of what you can learn</h2>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-2 font-semibold text-brand no-underline hover:underline">
              Explore All Resources <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PREVIEW.map((m) => {
              const Icon = m.icon
              return (
                <article key={m.title} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(9,47,44,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(9,47,44,0.25)]">
                  <div className="relative aspect-[4/3] p-6 text-white" style={{ background: `linear-gradient(155deg, ${m.from}, ${m.to})` }}>
                    <p className="font-serif text-2xl leading-tight">{m.title}</p>
                    <Icon size={64} strokeWidth={1} className="absolute bottom-4 right-4 text-white/25" />
                  </div>
                  <div className="p-5">
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-brand-text">{m.type}</span>
                    <h3 className="mt-3 font-serif text-xl leading-snug">{m.title}</h3>
                    <p className="mt-1 text-muted">{m.author}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-brand">{m.category}</p>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="mt-10 text-center"><Btn to="/catalogue" variant="outline" icon>Explore All Resources</Btn></div>
        </section>

        {/* FINAL CTA */}
        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-3xl bg-deep px-6 py-16 text-center text-white sm:px-12 lg:py-24">
            <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-luminosity" style={{ backgroundImage: `url(${bookshelf})` }} />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">Start Building Your Digital Library.</h2>
              <p className="mt-5 text-lg leading-relaxed text-white/75">
                Join LORIS and make learning resources easier to organise, discover and access.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Btn to="/personal/register" variant="light" icon>Create an Account</Btn>
                <Btn to="/organisation-registration" variant="ghost">Organisation Registration</Btn>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contact" className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm leading-relaxed text-muted">
              One centralised digital library for organisations and learners to discover, organise and access educational resources.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted"><UserRound size={15} /> Organisation admin? <Link to="/organisation/login" className="font-semibold text-brand">Organisation login</Link></p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 lg:grid-cols-2">
            {FOOTER_LINKS.map((l) => navLink(l, 'text-brand-text no-underline hover:text-brand hover:underline'))}
          </nav>
        </div>
        <div className="border-t border-line py-5 text-center text-sm text-muted">© {new Date().getFullYear()} LORIS. All rights reserved.</div>
      </footer>
    </div>
  )
}
