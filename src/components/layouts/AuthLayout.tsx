import type { ReactNode } from 'react'
import bookshelf from '../../assets/images/BookShelf.jpeg'

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{
        backgroundImage: `url(${bookshelf})`,
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {children}
      </div>
    </main>
  )
}

export default AuthLayout