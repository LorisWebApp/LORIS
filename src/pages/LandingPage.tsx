import { UserRound, Building2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import bookshelf from '../assets/images/BookShelf.jpeg'
import logo from '../assets/images/Logo.png'

function LandingPage() {
  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-6 sm:px-6"
      style={{ backgroundImage: `url(${bookshelf})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-deep/65" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-line bg-white px-5 py-6 text-center shadow-xl sm:px-10 sm:py-7">

        {/* LORIS Logo */}
        <div className="mb-4 flex justify-center">
          <img
            src={logo}
            alt="LORIS Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Welcome heading */}
        <h1 className="text-3xl font-semibold text-deep sm:text-4xl">
          Welcome to LORIS
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Your digital library awaits. Please select the type of account
          you would like to access.
        </p>

        {/* Account selection */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">

          {/* Personal Account */}
          <Link
            to="/personal/login"
            className="group flex flex-col items-center rounded-xl border border-line bg-mint-soft px-5 py-5 transition hover:border-brand hover:bg-mint hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-brand">
              <UserRound size={25} strokeWidth={1.8} />
            </div>

            <h2 className="mt-3 text-xl font-semibold text-deep">
              Personal Account
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              Access your personal library, discover materials and
              continue your reading journey.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 font-semibold text-brand group-hover:underline">
              Login <ArrowRight size={17} />
            </span>
          </Link>

          {/* Business Account */}
          <Link
            to="/organisation/login"
            className="group flex flex-col items-center rounded-xl border border-line bg-mint-soft px-5 py-5 transition hover:border-brand hover:bg-mint hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-brand">
              <Building2 size={25} strokeWidth={1.8} />
            </div>

            <h2 className="mt-3 text-xl font-semibold text-deep">
              Organisational Account
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              Access your organisation's digital library and
              manage its resources.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 font-semibold text-brand group-hover:underline">
              Login <ArrowRight size={17} />
            </span>
          </Link>

        </div>

      </div>
    </main>
  )
}

export default LandingPage