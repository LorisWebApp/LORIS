import { useState, type ChangeEvent } from 'react'

interface InputProps {
  label: string
  type: string
  placeholder: string
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function Input({
  label,
  type,
  placeholder,
  name,
  value,
  onChange,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'

  return (
    <div className="mb-5">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-teal-900"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-emerald-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-800"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              // Eye with a slash
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 7-.3 1.1-1 2.3-2 3.3" />
                <path d="M6.2 6.2C4.2 7.5 2.5 9.5 2 12c.7 2.5 4 7 10 7 1.3 0 2.5-.3 3.6-.8" />
              </svg>
            ) : (
              // Normal eye
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default Input