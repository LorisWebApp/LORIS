import logo from '../../assets/images/Logo.png'

function Logo() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <img
        src={logo}
        alt="LORIS Logo"
        style={{ width: '65px', height: '65px' }}
        className="mb-2 object-contain"
      />

      <h1 className="text-3xl font-serif font-bold text-teal-900">
        Loris Web Library
      </h1>

      <p className="mt-2 text-xs tracking-[0.3em] text-teal-800">
        READING FOR EVERYONE
      </p>
    </div>
  )
}

export default Logo