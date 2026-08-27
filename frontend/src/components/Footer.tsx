const footerLinks = {
  Contact: ['hello@freshferme.ai', '+91 98765 43210', 'Bengaluru, India'],
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xl font-black text-white shadow-lg shadow-emerald-500/20">
              F
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900">Fresh Ferme</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
                from farm to market
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
            A transparent, AI-powered platform enabling fairer trade between farmers, FPOs, and modern buyers.
          </p>
        </div>

        {Object.entries(footerLinks).map(([heading, links]) => (
          <div key={heading}>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{heading}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="transition hover:text-emerald-700">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200">
        <div className="section-shell flex flex-col items-center justify-between gap-3 py-5 text-sm text-slate-500 md:flex-row">
          <span>© 2026 Fresh Ferme. All rights reserved.</span>
          <span>Designed for fairer and smarter agriculture.</span>
        </div>
      </div>
    </footer>
  )
}
