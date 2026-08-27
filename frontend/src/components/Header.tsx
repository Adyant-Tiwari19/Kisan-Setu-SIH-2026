import { Link } from 'react-router-dom'


export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-[#f7f5ef]/85 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xl font-black text-white shadow-lg shadow-emerald-500/30">
            F
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">Fresh Ferme</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
              from farm to market
            </div>
          </div>
        </Link>


        <div className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/join-now"
            className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            Join now
          </Link>
        </div>
      </div>
    </header>
  )
}
