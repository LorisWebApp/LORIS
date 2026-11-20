import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
}

function Button({
  children,
  type = 'submit',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-lg bg-teal-800 px-4 py-3 font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export default Button