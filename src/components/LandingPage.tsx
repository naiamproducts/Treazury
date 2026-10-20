/**
 * Treazury — Landing Page (luxe-editorial dark style).
 *
 * English agency-facing copy for import/export agencies (import-export-pivot):
 * SWIFT-vs-USDC storytelling and the payment→document-release proposition.
 * All user-facing strings are sourced from the i18n catalog via t()
 * (src/i18n/en.ts) — no hardcoded copy literals. CTA buttons call onEnterApp,
 * which routes into the app auth flow (App stage 'landing' -> 'auth').
 * The hero card hosts the access-request form (AccessRequestForm); that
 * component keeps its own strings until the app-shell EN sweep (Phase 7).
 * The terms banner's Terms/Privacy links open an in-page legal dialog
 * (legal.* catalog keys) instead of dead in-page anchors.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AccessRequestForm from './AccessRequestForm'
import { t } from '../i18n/t'

interface LandingPageProps {
  onEnterApp: () => void
  showRegister: boolean
}

/** SWIFT vs USDC outcome rows (L-R2): speed, cost, visibility. */
const OUTCOMES = [
  {
    label: t('landing.comparison.speed.label'),
    swift: t('landing.comparison.speed.swift'),
    usdc: t('landing.comparison.speed.usdc'),
  },
  {
    label: t('landing.comparison.cost.label'),
    swift: t('landing.comparison.cost.swift'),
    usdc: t('landing.comparison.cost.usdc'),
  },
  {
    label: t('landing.comparison.visibility.label'),
    swift: t('landing.comparison.visibility.swift'),
    usdc: t('landing.comparison.visibility.usdc'),
  },
]

/** Order → payment → release flow steps (L-R3). */
const FLOW_STEPS = [
  t('landing.flow.step1'),
  t('landing.flow.step2'),
  t('landing.flow.step3'),
]

/** Legal dialog flavors opened from the terms banner. */
type LegalDoc = 'terms' | 'privacy'

/** Ordered paragraphs rendered inside the legal dialog (formal `<ol>`). */
const LEGAL_PARAGRAPHS: Record<LegalDoc, string[]> = {
  terms: [
    t('legal.terms.operator'),
    t('legal.terms.role'),
    t('legal.terms.custody'),
    t('legal.terms.thirdParties'),
    t('legal.terms.alpha'),
    t('legal.terms.liability'),
  ],
  privacy: [
    t('legal.privacy.intro'),
    t('legal.privacy.data'),
    t('legal.privacy.providers'),
    t('legal.privacy.blockchain'),
    t('legal.privacy.technical'),
    t('legal.privacy.rights'),
  ],
}

/**
 * LegalDialog — Terms of Service / Privacy Notice popup opened from the
 * landing terms banner. Luxe-dark glass card mirroring CountrySetupModal
 * (framer-motion enter/exit over a dark translucent backdrop). Fully
 * accessible: role="dialog", aria-modal, aria-labelledby title, Escape and
 * backdrop click close, the container takes focus on open. Body scroll is
 * locked while open. All copy comes from the i18n catalog (legal.* keys).
 */
function LegalDialog({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Move focus into the dialog when it opens so keyboard users land inside.
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  // Lock body scroll while the dialog is open; restore on close/unmount.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const titleId = `legal-dialog-title-${doc}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 font-sans"
      style={{ background: 'rgba(7,8,10,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={event => {
          if (event.key === 'Escape') onClose()
        }}
        onClick={event => event.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="luxe-glass w-full max-w-xl rounded-[2rem] p-6 sm:p-8 max-h-[85vh] overflow-y-auto outline-none"
        data-purpose="legal-dialog"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 id={titleId} className="font-serif text-2xl font-medium text-white">
            {doc === 'terms' ? t('legal.title.terms') : t('legal.title.privacy')}
          </h2>
          <button
            type="button"
            aria-label={t('legal.closeAria')}
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer px-1 shrink-0"
          >
            ✕
          </button>
        </div>
        <ol className="list-decimal list-outside pl-5 space-y-4">
          {LEGAL_PARAGRAPHS[doc].map(paragraph => (
            <li key={paragraph} className="text-sm font-light leading-relaxed text-slate-300">
              {paragraph}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex w-full items-center justify-center rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          {t('legal.close')}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function LandingPage({ onEnterApp, showRegister }: LandingPageProps) {
  const [termsVisible, setTermsVisible] = useState(true)
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null)

  const heroCtaLabel = showRegister ? t('landing.hero.cta.register') : t('landing.hero.cta.login')

  return (
    <div className="luxe-landing min-h-screen font-sans selection:bg-white selection:text-black relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-40 -left-40 w-[38rem] h-[38rem] bg-cyan-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-48 w-[42rem] h-[42rem] bg-slate-600/5 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 luxe-dotgrid"></div>
      </div>

      {/* Header */}
      <header
        className="relative z-20 w-full px-6 lg:px-16 py-7 flex items-center justify-between max-w-7xl mx-auto"
        data-purpose="site-navigation-bar"
      >
        <div className="flex items-center space-x-3" data-purpose="brand-logo-container">
          <button type="button" onClick={onEnterApp} className="group flex items-baseline gap-1 cursor-pointer">
            <span className="font-serif text-3xl sm:text-4xl tracking-tight text-white font-medium group-hover:text-slate-200 transition-colors">
              Treazury
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-icyCyan inline-block opacity-90 shadow-[0_0_8px_rgba(165,243,252,0.8)]"></span>
          </button>
        </div>
        <div className="flex items-center space-x-5" data-purpose="header-cta-group">
          <button
            type="button"
            onClick={onEnterApp}
            data-purpose="header-signin-button"
            className="hidden sm:inline-block text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {t('landing.header.login')}
          </button>
          <button
            type="button"
            onClick={onEnterApp}
            className="relative group px-5 py-2.5 rounded-full text-xs font-mono tracking-wider text-white transition-all duration-300 border border-white/20 hover:border-white/50 bg-white/[0.04] hover:bg-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.04)] hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('landing.header.register')} <span className="text-icyCyan transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <main
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-12 items-center"
        data-purpose="hero-main-container"
      >
        {/* Left column */}
        <section className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-6" data-purpose="hero-left-column">
          <div
            className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/[0.03] text-slate-200 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] mb-8"
            data-purpose="audience-badge"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-icyCyan mr-2.5 shadow-[0_0_6px_rgba(165,243,252,0.9)] animate-pulse"></span>
            {t('landing.hero.badge')}
          </div>

          <div className="relative w-full mb-7" data-purpose="headline-block">
            <h1 className="text-4xl sm:text-6xl xl:text-[4.2rem] font-serif font-light leading-[1.08] tracking-tight text-white">
              {t('landing.hero.title.line1')} <br />
              <span className="italic font-normal text-slate-100">{t('landing.hero.title.line2')}</span> <br />
              <span className="font-light tracking-normal bg-gradient-to-r from-white via-slate-200 to-cyan-200/90 bg-clip-text text-transparent">
                {t('landing.hero.title.line3')}
              </span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-cyan-400 to-transparent mt-6 opacity-60"></div>
          </div>

          <p
            className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg font-light tracking-wide mb-10"
            data-purpose="hero-subtitle"
          >
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-11" data-purpose="cta-action-row">
            <button
              type="button"
              onClick={onEnterApp}
              className="group relative px-8 py-4 rounded-full bg-white text-black font-medium text-xs sm:text-sm tracking-wider uppercase font-mono transition-all duration-300 hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <span>{heroCtaLabel}</span>
              <span className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-black">
                →
              </span>
            </button>
            <div id="regiones" className="flex flex-wrap items-center gap-3 scroll-mt-24">
              <div className="passport-stamp px-3 py-1.5 rounded bg-white/[0.02] border-white/20 flex items-center gap-2">
                <span className="text-xs">🇦🇷</span>
                <span className="text-[11px] font-mono text-slate-200 font-semibold tracking-widest">{t('landing.hero.regions.argentina')}</span>
                <span className="text-[9px] font-mono text-icyCyan border border-cyan-400/40 px-1 py-0.5 rounded-sm bg-cyan-950/40 font-semibold">
                  {t('landing.hero.regions.live')}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tracking-wider">
                {t('landing.hero.regions.upcoming')}
              </span>
              <a
                className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors tracking-wider underline decoration-white/20 underline-offset-4 flex items-center gap-1"
                href="#solicitar-acceso"
              >
                {t('landing.hero.regions.requestAccess')}
              </a>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10 w-full"
            data-purpose="trust-metric-chips"
          >
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-white">{t('landing.trust.custodyValue')}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">{t('landing.trust.custodyLabel')}</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-cyan-300">{t('landing.trust.usdcValue')}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">{t('landing.trust.usdcLabel')}</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-slate-200">{t('landing.trust.speedValue')}</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">{t('landing.trust.speedLabel')}</span>
            </div>
          </div>
        </section>

        {/* Right column — access request */}
        <section
          className="lg:col-span-6 relative w-full flex justify-center flex-col items-center"
          data-purpose="hero-access-request"
        >
          <div
            id="solicitar-acceso"
            className="w-full max-w-[500px] luxe-glass rounded-[2rem] p-6 sm:p-7 relative platinum-glow scroll-mt-24"
            data-purpose="main-glassmorphic-card"
          >
            <AccessRequestForm onEnterApp={onEnterApp} />
          </div>

          {/* Partners strip */}
          <div className="w-full max-w-[500px] mt-8 pt-2" data-purpose="powered-by-ticker-section">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent flex-1"></div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-slate-400 uppercase flex items-center gap-2">
                {t('landing.ticker.heading')}
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent flex-1"></div>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl bg-black/30 border border-white/5 py-3 px-2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="flex items-center justify-around gap-6 opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <img
                    src="/logos/circle-usdc.svg"
                    alt=""
                    className="h-3.5 w-auto"
                  />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                    {t('landing.ticker.circle')}
                  </span>
                </div>
                <span className="text-slate-600 text-xs select-none">•</span>
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <img
                    src="/logos/privy.svg"
                    alt=""
                    className="h-3.5 w-auto"
                  />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                    {t('landing.ticker.privy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SWIFT vs USDC — outcome comparison (L-R2) */}
      <section
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pb-14"
        data-purpose="swift-usdc-comparison"
      >
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-7">
          {t('landing.comparison.heading')}
        </h2>
        <p className="text-sm font-light leading-relaxed text-slate-400 max-w-2xl mb-7">
          {t('landing.comparison.subheading')}
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="px-5 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              {t('landing.comparison.col.outcome')}
            </div>
            <div className="px-5 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
              {t('landing.comparison.col.swift')}
            </div>
            <div className="px-5 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] text-icyCyan">
              {t('landing.comparison.col.usdc')}
            </div>
          </div>
          {OUTCOMES.map(outcome => (
            <div key={outcome.label} className="grid grid-cols-3 border-b border-white/5 last:border-b-0">
              <div className="px-5 py-4 text-xs font-mono uppercase tracking-wider text-slate-300">
                {outcome.label}
              </div>
              <div className="px-5 py-4 text-sm font-light text-slate-400">{outcome.swift}</div>
              <div className="px-5 py-4 text-sm font-light text-white">{outcome.usdc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment → document release (L-R3) */}
      <section
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pb-20"
        data-purpose="payment-document-flow"
      >
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-7">
          {t('landing.flow.heading')}
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {FLOW_STEPS.map((step, index) => (
            <li key={step} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
              <span className="font-mono text-[11px] tracking-[0.25em] text-icyCyan">
                {`0${index + 1}`}
              </span>
              <p className="mt-2 text-sm font-light text-slate-200 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
        <p
          className="max-w-3xl text-sm sm:text-base font-light leading-relaxed text-slate-400"
          data-purpose="doc-release-statement"
        >
          {t('landing.flow.statement')}
        </p>
      </section>

      {/* Terms pill */}
      {termsVisible && (
        <aside
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-xl z-50 transition-all duration-300"
          data-purpose="terms-cookie-banner"
        >
          <div className="luxe-glass-pill rounded-full py-3 px-5 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-icyCyan animate-pulse"></div>
              <p className="text-xs text-slate-300 font-light leading-none">
                {t('landing.terms.prefix')}{' '}
                <button
                  type="button"
                  onClick={() => setLegalDoc('terms')}
                  className="text-white underline decoration-white/40 hover:decoration-white font-medium cursor-pointer"
                >
                  {t('landing.terms.terms')}
                </button>{' '}
                <button
                  type="button"
                  onClick={() => setLegalDoc('privacy')}
                  className="text-white underline decoration-white/40 hover:decoration-white font-medium cursor-pointer"
                >
                  {t('landing.terms.privacy')}
                </button>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setTermsVisible(false)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider text-black bg-white hover:bg-slate-200 transition-all cursor-pointer font-medium"
              >
                {t('landing.terms.dismiss')}
              </button>
              <button
                type="button"
                aria-label={t('landing.terms.dismissAria')}
                onClick={() => setTermsVisible(false)}
                className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Legal popup (Terms / Privacy) — opened from the terms banner links.
          Banner dismiss stays independent: opening a dialog never closes it. */}
      <AnimatePresence>
        {legalDoc && <LegalDialog doc={legalDoc} onClose={() => setLegalDoc(null)} />}
      </AnimatePresence>
    </div>
  )
}
