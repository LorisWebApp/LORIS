import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight, Bookmark, BookOpen, BookOpenText, Building2, Check, Download, FileText, Headphones,
  Heart, Library, NotebookPen, ShieldCheck, Upload, UserRound, Users, Video, WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import bookshelf from '../assets/images/BookShelf.jpeg'
import { supabase } from '../../../services/supabase'
import { PublicHeader } from '../components/layouts/PublicHeader'

/* ---------- content ---------- */

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

/* Public catalogue data: the `public_materials` view exposes descriptions only, never file links. */
type PublicMaterial = {
  id: string
  title: string
  author: string | null
  image_url: string | null
  file_type: string | null
  category_name: string | null
}

const GRADIENTS = [
  ['#0b7a63', '#092f2c'],
  ['#1f6f78', '#05201e'],
  ['#2f8f83', '#0f3d38'],
  ['#4aa595', '#0b3b36'],
]

function usePublicMaterials(limit: number) {
  const [items, setItems] = useState<PublicMaterial[] | null>(null)
  useEffect(() => {
    let alive = true
    supabase
      .from('public_materials')
      .select('id,title,author,image_url,file_type,category_name')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => { if (alive) setItems(error || !data ? [] : (data as PublicMaterial[])) })
    return () => { alive = false }
  }, [limit])
  return items
}

function kindOf(fileType: string | null): { label: string; icon: LucideIcon } {
  const t = (fileType ?? '').toLowerCase()
  if (t.includes('audio') || t.includes('mp3')) return { label: 'Audio', icon: Headphones }
  if (t.includes('video') || t.includes('mp4')) return { label: 'Video', icon: Video }
  if (t.includes('epub')) return { label: 'eBook', icon: FileText }
  if (t.includes('pdf')) return { label: 'Book', icon: BookOpen }
  return { label: 'Resource', icon: FileText }
}

const FOOTER_LINKS: { label: string; to?: string; href?: string }[] = [
  { label: 'Home', href: '#top' },
  { label: 'Catalogue', to: '/catalogue' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
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

/** A real cover when the material has one, otherwise a branded gradient cover. */
function Cover({ m, i, className = '' }: { m?: PublicMaterial; i: number; className?: string }) {
  if (m?.image_url) return <img src={m.image_url} alt={m.title} loading="lazy" className={`h-full w-full object-cover ${className}`} />
  const [from, to] = GRADIENTS[i % GRADIENTS.length]
  return (
    <div className={`flex h-full w-full flex-col justify-between p-4 text-white ${className}`} style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}>
      <p className="font-serif text-lg leading-tight sm:text-xl">{m?.title ?? 'LORIS'}</p>
      <BookOpenText size={30} strokeWidth={1.2} className="text-white/40" />
    </div>
  )
}

function Book({ m, i, className }: { m?: PublicMaterial; i: number; className: string }) {
  return (
    <div className={`absolute aspect-[2/3] overflow-hidden rounded-l-sm rounded-r-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] ${className}`}>
      <Cover m={m} i={i} />
      <div aria-hidden className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/45 via-white/20 to-transparent" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
      <div aria-hidden className="absolute inset-y-1 right-0 w-1.5 bg-gradient-to-l from-white/70 to-white/20" />
    </div>
  )
}

const glass = 'absolute border border-white/20 bg-white/10 text-white shadow-2xl backdrop-blur-md'

/** Hero picture: a floating shelf of real catalogue covers with glass cards for LORIS features. */
function HeroVisual({ items }: { items: PublicMaterial[] }) {
  const covers = items.filter((m) => m.image_url).concat(items.filter((m) => !m.image_url)).slice(0, 3)
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[520px]">
      <div aria-hidden className="absolute inset-x-6 inset-y-10 rounded-full bg-brand/30 blur-[90px]" />
      <Book m={covers[0]} i={0} className="left-[1%] top-[16%] w-[34%] -rotate-6" />
      <Book m={covers[1]} i={1} className="left-[32%] top-[2%] z-10 w-[38%] rotate-2" />
      <Book m={covers[2]} i={2} className="right-[1%] top-[20%] w-[33%] rotate-6" />

      <div className={`${glass} bottom-[4%] left-[2%] z-20 w-[62%] rounded-2xl p-4`}>
        <div className="flex items-center justify-between text-sm font-semibold"><span>Continue reading</span><span className="text-badge">64%</span></div>
        <div className="mt-3 h-1.5 rounded-full bg-white/20"><div className="h-full w-[64%] rounded-full bg-badge" /></div>
        <p className="mt-2 text-xs text-white/60">Pick up right where you left off</p>
      </div>
      <div className={`${glass} bottom-[16%] right-[0%] z-20 flex items-center gap-3 rounded-2xl px-4 py-3`}>
        <span className="grid size-9 place-items-center rounded-lg bg-badge/20 text-badge"><Download size={18} /></span>
        <div><p className="text-sm font-semibold">Saved offline</p><p className="text-xs text-white/60">Ready without internet</p></div>
      </div>
      <div className={`${glass} left-[0%] top-[2%] z-20 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold`}>
        <NotebookPen size={15} className="text-badge" /> Notes &amp; bookmarks
      </div>
    </div>
  )
}

/* ---------- features (bento) ---------- */

function FeatureCopy({ icon: Icon, title, text, dark = false }: { icon: LucideIcon; title: string; text: string; dark?: boolean }) {
  return (
    <div>
      <span className={`grid size-12 place-items-center rounded-xl ${dark ? 'bg-white/10 text-badge' : 'bg-mint text-brand'}`}><Icon size={23} strokeWidth={1.8} /></span>
      <h3 className="mt-5 font-serif text-3xl">{title}</h3>
      <p className={`mt-2 max-w-sm text-lg leading-relaxed ${dark ? 'text-white/70' : 'text-muted'}`}>{text}</p>
    </div>
  )
}

const bar = 'h-2 rounded-full'

function Features() {
  const card = 'relative overflow-hidden rounded-3xl p-8 transition hover:-translate-y-1'
  return (
    <section id="features" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>What LORIS can do</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Everything learning needs, in one place</h2>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {/* Digital Library */}
        <article className={`${card} bg-ink text-white lg:col-span-2`}>
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <FeatureCopy dark icon={Library} title="Digital Library" text="Access and manage learning materials in one place." />
            <div className="space-y-3">
              {[Headphones, BookOpen, Video].map((Icon, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-badge/15 text-badge"><Icon size={18} /></span>
                  <div className="flex-1 space-y-2"><div className={`${bar} w-3/4 bg-white/30`} /><div className={`${bar} w-1/2 bg-white/15`} /></div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Organisation Management */}
        <article className={`${card} border border-line bg-white shadow-[0_2px_12px_rgba(9,47,44,0.05)]`}>
          <FeatureCopy icon={Building2} title="Organisation Management" text="Organisations can manage members and their learning resources." />
          <div className="mt-6 flex items-center">
            {['A', 'K', 'M', 'T'].map((c, i) => (
              <span key={c} className="-ml-2 grid size-10 place-items-center rounded-full border-2 border-white text-sm font-semibold text-white first:ml-0" style={{ background: GRADIENTS[i][0] }}>{c}</span>
            ))}
            <span className="ml-3 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-brand-text">Members</span>
          </div>
        </article>

        {/* Offline Access */}
        <article className={`${card} border border-line bg-white shadow-[0_2px_12px_rgba(9,47,44,0.05)]`}>
          <FeatureCopy icon={WifiOff} title="Offline Access" text="Download resources for access without an internet connection." />
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-mint p-3">
              <span className="grid size-7 place-items-center rounded-full bg-brand text-white"><Check size={14} /></span>
              <div className="flex-1"><div className={`${bar} w-full bg-brand/40`} /></div>
              <span className="text-xs font-semibold text-brand-text">Saved</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-mint-soft p-3">
              <span className="grid size-7 place-items-center rounded-full bg-white text-brand"><Download size={14} /></span>
              <div className="flex-1"><div className={`${bar} bg-white`}><div className={`${bar} w-3/5 bg-brand`} /></div></div>
              <span className="text-xs font-semibold text-brand-text">60%</span>
            </div>
          </div>
        </article>

        {/* Personal Library */}
        <article className={`${card} bg-mint lg:col-span-2`}>
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <FeatureCopy icon={Heart} title="Personal Library" text="Save favourites, notes and bookmarks for easy access." />
            <div className="grid grid-cols-3 gap-3">
              {[[Heart, 'Favourites'], [NotebookPen, 'Notes'], [Bookmark, 'Bookmarks']].map(([I, label]) => {
                const Icon = I as LucideIcon
                return (
                  <div key={label as string} className="rounded-2xl bg-white p-4 text-center shadow-[0_2px_12px_rgba(9,47,44,0.06)]">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-mint text-brand"><Icon size={18} /></span>
                    <p className="mt-3 text-sm font-semibold text-deep">{label as string}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

/* ---------- about ---------- */

const ACRONYM = ['Library', 'Organisation', 'Resource', 'Information', 'System']

function About() {
  return (
    <section id="about" className="scroll-mt-20 border-y border-line bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
        <div>
          <Eyebrow>Who we are</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">About LORIS</h2>
          <ul className="mt-10 space-y-2">
            {ACRONYM.map((w) => (
              <li key={w} className="flex items-baseline gap-4 border-b border-line pb-2">
                <span className="w-10 font-serif text-4xl text-brand">{w[0]}</span>
                <span className="text-lg text-muted">{w.slice(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-deep/80">
          <p className="font-serif text-2xl leading-snug text-deep sm:text-[28px]">
            LORIS (Library Organisation and Resource Information System) is a digital library platform designed to simplify how organisations manage, organise and distribute educational resources.
          </p>
          <p>
            The platform provides a centralised environment where users can discover learning materials, access digital resources and manage their personal libraries. It also enables organisations to manage their digital collections, organise members and make educational content more accessible.
          </p>
          <p>
            By bringing resource management and digital access together, LORIS aims to create a more organised and convenient learning experience.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

export default function LandingPage() {
  const materials = usePublicMaterials(12)
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  const navLink = (item: { label: string; to?: string; href?: string }, cls: string, onClick?: () => void) =>
    item.to
      ? <Link key={item.label} to={item.to} onClick={onClick} className={cls}>{item.label}</Link>
      : <a key={item.label} href={item.href} onClick={onClick} className={cls}>{item.label}</a>

  return (
    <div id="top" className="min-h-screen scroll-smooth bg-page text-deep">
      <PublicHeader />

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
                <Btn to="/register" variant="ghost">Get Started</Btn>
              </div>
              <p className="mt-6 text-sm text-white/50">
                Popular: Novel <span className="mx-1.5">•</span> Science <span className="mx-1.5">•</span> Design <span className="mx-1.5">•</span> Personal growth
              </p>
            </div>
            <HeroVisual items={materials ?? []} />
          </div>
        </section>

        {/* FEATURES */}
        <Features />

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

        {/* ABOUT */}
        <About />

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
            {materials === null && [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-2xl border border-line bg-white" />
            ))}
            {materials?.slice(0, 4).map((m, i) => {
              const { label, icon: Icon } = kindOf(m.file_type)
              return (
                <Link key={m.id} to={`/material/${m.id}`} className="group overflow-hidden rounded-2xl border border-line bg-white text-inherit no-underline shadow-[0_2px_12px_rgba(9,47,44,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(9,47,44,0.25)]">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Cover m={m} i={i} className="transition duration-500 group-hover:scale-105" />
                    {!m.image_url && <Icon size={64} strokeWidth={1} className="absolute bottom-4 right-4 text-white/25" />}
                  </div>
                  <div className="p-5">
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-brand-text">{label}</span>
                    <h3 className="mt-3 line-clamp-2 font-serif text-xl leading-snug">{m.title}</h3>
                    <p className="mt-1 text-muted">{m.author || 'Unknown author'}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-brand">{m.category_name || 'General'}</p>
                  </div>
                </Link>
              )
            })}
            {materials?.length === 0 && (
              <p className="col-span-full rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
                New resources are being added to the catalogue. Check back soon.
              </p>
            )}
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
                <Btn to="/register" variant="light" icon>Create an Account</Btn>
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
