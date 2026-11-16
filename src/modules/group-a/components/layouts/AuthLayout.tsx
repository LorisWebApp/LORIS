import type { ReactNode } from 'react'
import bookshelf from '../../assets/images/BookShelf.jpeg'

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8 sm:px-6"
      style={{
        backgroundImage: `url(${bookshelf})`,
      }}
    >
      <div className="w-full max-w-md rounded-md border border-line bg-white px-6 py-8 sm:px-9 sm:py-10">
        {children}
      </div>
    </main>
  )
}

export default AuthLayout