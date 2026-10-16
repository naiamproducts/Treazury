/**
 * Treazury — Landing Page (luxe-editorial dark style).
 *
 * React port of the Treazury design brief. CTA buttons call onEnterApp,
 * which routes into the app auth flow (App stage 'landing' -> 'auth').
 * Interactive bits (Demo/Calculator tabs, fee slider, terms pill) are
 * React state. The demo video is a youtube-nocookie placeholder iframe.
 */

import { useState } from 'react'

interface LandingPageProps {
  onEnterApp: () => void
  showRegister: boolean
}

type Tab = 'demo' | 'calc'

const MIN_VOLUME = 1000
const MAX_VOLUME = 150000
const DEFAULT_VOLUME = 25000
// Benchmarks for the savings readout: TradFi/SWIFT-style 3.04% vs the
// 0.35% protocol rate capped at $15.
const BANK_RATE = 0.0304
const PROTOCOL_RATE = 0.0035
const PROTOCOL_CAP = 15

function formatVolume(v: number): string {
  return `$${v.toLocaleString('en-US')} USDC`
}

function formatSavings(volume: number): string {
  const bankFee = volume * BANK_RATE
  const protocolFee = Math.min(volume * PROTOCOL_RATE, PROTOCOL_CAP)
  if (bankFee <= 0) return '+0.0%'
  const savings = (1 - protocolFee / bankFee) * 100
  return `+${savings.toFixed(1)}%`
}

export default function LandingPage({ onEnterApp, showRegister }: LandingPageProps) {
  const [tab, setTab] = useState<Tab>('demo')
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [termsVisible, setTermsVisible] = useState(true)

  const heroCtaLabel = showRegister ? 'Crear cuenta gratis' : 'Entrar al panel'

  const tabButton = (active: boolean) =>
    `w-1/2 py-2 px-4 text-xs font-mono tracking-wider rounded-full transition-all duration-300 ${
      active
        ? 'text-white bg-white/10 border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
        : 'text-slate-400 hover:text-white'
    }`

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
          <span className="hidden sm:inline-block ml-3 pl-3 border-l border-white/10 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            Liquidez privada
          </span>
        </div>
        <nav
          className="hidden md:flex items-center space-x-9 text-xs font-mono uppercase tracking-[0.2em] text-slate-400"
          data-purpose="header-nav-links"
        >
          <a className="hover:text-white transition-colors duration-200" href="#caracteristicas">
            Funciones
          </a>
          <a className="hover:text-white transition-colors duration-200" href="#whatsapp">
            WhatsApp B2B
          </a>
          <a className="hover:text-white transition-colors duration-200" href="#calculadora">
            Calculadora
          </a>
          <a className="hover:text-white transition-colors duration-200" href="#tarifas">
            Tarifas
          </a>
        </nav>
        <div className="flex items-center space-x-5" data-purpose="header-cta-group">
          <button
            type="button"
            onClick={onEnterApp}
            className="hidden sm:inline-block text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={onEnterApp}
            className="relative group px-5 py-2.5 rounded-full text-xs font-mono tracking-wider text-white transition-all duration-300 border border-white/20 hover:border-white/50 bg-white/[0.04] hover:bg-white/[0.08] shadow-[0_0_15px_rgba(255,255,255,0.04)] hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              Crear cuenta <span className="text-icyCyan transition-transform group-hover:translate-x-0.5">→</span>
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
            Para proveedores mayoristas B2B
          </div>

          <div className="relative w-full mb-7" data-purpose="headline-block">
            <h1 className="text-4xl sm:text-6xl xl:text-[4.2rem] font-serif font-light leading-[1.08] tracking-tight text-white">
              Cobrá tus <br />
              <span className="italic font-normal text-slate-100">pedidos de WhatsApp</span> <br />
              <span className="font-light tracking-normal bg-gradient-to-r from-white via-slate-200 to-cyan-200/90 bg-clip-text text-transparent">
                en USDC al instante.
              </span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-cyan-400 to-transparent mt-6 opacity-60"></div>
          </div>

          <p
            className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg font-light tracking-wide mb-10"
            data-purpose="hero-subtitle"
          >
            Treazury une el comercio mayorista por WhatsApp con liquidación cripto institucional. Catálogo
            simple, pedidos cifrados y cumplimiento automatizado — directo a tu wallet en segundos.
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="passport-stamp px-3 py-1.5 rounded bg-white/[0.02] border-white/20 flex items-center gap-2">
                <span className="text-xs">🇦🇷</span>
                <span className="text-[11px] font-mono text-slate-200 font-semibold tracking-widest">ARGENTINA</span>
                <span className="text-[9px] font-mono text-icyCyan border border-cyan-400/40 px-1 py-0.5 rounded-sm bg-cyan-950/40 font-semibold">
                  LIVE
                </span>
              </div>
              <div className="passport-stamp px-3 py-1.5 rounded bg-white/[0.01] border-white/10 opacity-60 flex items-center gap-2">
                <span className="text-xs grayscale">🇻🇪</span>
                <span className="text-[11px] font-mono text-slate-400 tracking-widest line-through">VENEZUELA</span>
                <span className="text-[9px] font-mono text-slate-500 border border-slate-700 px-1 rounded-sm">Q3</span>
              </div>
              <a
                className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors tracking-wider underline decoration-white/20 underline-offset-4 flex items-center gap-1"
                href="#request-country"
              >
                Solicitar región →
              </a>
            </div>
          </div>

          <div
            id="tarifas"
            className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10 w-full"
            data-purpose="trust-metric-chips"
          >
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-white">0.00%</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Comisiones ocultas</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-cyan-300">2.0s</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Liquidación neta</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-light text-slate-200">T+0</span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Liquidez inmediata</span>
            </div>
          </div>
        </section>

        {/* Right column — interactive showcase */}
        <section
          className="lg:col-span-6 relative w-full flex justify-center flex-col items-center"
          data-purpose="hero-interactive-showcase"
        >
          <div
            id="whatsapp"
            className="w-full max-w-[500px] luxe-glass rounded-[2rem] p-6 sm:p-7 relative platinum-glow"
            data-purpose="main-glassmorphic-card"
          >
            <div
              className="w-full bg-black/40 p-1 rounded-full flex items-center justify-between mb-6 border border-white/10"
              data-purpose="segmented-tab-switcher"
            >
              <button type="button" onClick={() => setTab('demo')} className={tabButton(tab === 'demo')}>
                [Demo en vivo]
              </button>
              <button type="button" onClick={() => setTab('calc')} className={tabButton(tab === 'calc')}>
                [Calculadora de comisiones]
              </button>
            </div>

            {tab === 'demo' ? (
              <div className="space-y-4 transition-all duration-300" id="panel-demo">
                <div className="flex items-center justify-between pb-1 text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Flujo fintech en vivo
                  </span>
                  <span className="text-[10px] text-slate-400 border border-white/10 px-2 py-0.5 rounded-full bg-white/[0.02]">
                    Vista previa HD
                  </span>
                </div>
                <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl group">
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black/90 backdrop-blur-md rounded-full border border-white/10 z-20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-800 mr-2"></div>
                    <div className="w-6 h-1 rounded-full bg-slate-800"></div>
                  </div>
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                      src="https://www.youtube-nocookie.com/embed/ScMzIvxBSi4?rel=0&modestbranding=1"
                      title="Video demo de Treazury"
                    ></iframe>
                  </div>
                  <div className="p-3.5 bg-graphite/95 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs">
                        💬
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white tracking-wide">Pedido #8849 confirmado</p>
                        <p className="text-[10px] font-mono text-slate-400">Wholesale Textile Supply Ltd.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-semibold text-cyan-300">+ $14,250.00 USDC</p>
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Liquidado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 transition-all duration-300" id="panel-calc">
                <div id="calculadora" className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white tracking-wider uppercase font-semibold">Modelo de liquidación por volumen</span>
                  <span className="text-[10px] text-icyCyan border border-cyan-400/30 px-2 py-0.5 rounded-full bg-cyan-950/40">
                    TRC20 / Polygon / Arbitrum
                  </span>
                </div>
                <div className="bg-black/50 p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Volumen operado</span>
                    <span className="text-lg font-mono font-bold text-white tracking-tight">
                      {formatVolume(volume)}
                    </span>
                  </div>
                  <input
                    aria-label="Volumen mensual en USDC"
                    className="w-full h-1.5 rounded-lg cursor-pointer accent-cyan-300"
                    min={MIN_VOLUME}
                    max={MAX_VOLUME}
                    step={1000}
                    type="range"
                    value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                  />
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                        <span className="text-slate-400">Ahorro vs SWIFT/banco:</span>
                        <span className="font-bold text-cyan-300">{formatSavings(volume)}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Comisión de protocolo: <span className="text-white font-medium">0.35% USDC</span> (Tope $15)
                      </div>
                    </div>
                    <div className="w-16 h-8 flex items-center justify-center">
                      <svg
                        className="w-full h-full text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 100 45"
                      >
                        <path d="M5,38 L30,28 L55,34 L85,10"></path>
                        <polyline points="72,10 85,10 85,22"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Sin reservas retenidas.</span>
                  <span className="text-slate-200">Flujo 100% autocustodiado</span>
                </div>
              </div>
            )}
          </div>

          {/* Partners strip */}
          <div id="caracteristicas" className="w-full max-w-[500px] mt-8 pt-2" data-purpose="powered-by-ticker-section">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent flex-1"></div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-slate-400 uppercase flex items-center gap-2">
                IMPULSADO POR LOS MEJORES
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent flex-1"></div>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl bg-black/30 border border-white/5 py-3 px-2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="flex items-center justify-around gap-6 opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="2"></circle>
                    <path d="M12 6v12M8 10h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                  </svg>
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                    Circle (USDC)
                  </span>
                </div>
                <span className="text-slate-600 text-xs select-none">•</span>
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <svg
                    className="w-3.5 h-3.5 text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                    Privy
                  </span>
                </div>
                <span className="text-slate-600 text-xs select-none">•</span>
                <div className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <svg
                    className="w-3.5 h-3.5 text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                    Kapso
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

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
                Al usar Treazury, aceptás nuestros{' '}
                <a className="text-white underline decoration-white/40 hover:decoration-white font-medium" href="#terms">
                  Términos
                </a>{' '}
                y{' '}
                <a
                  className="text-white underline decoration-white/40 hover:decoration-white font-medium"
                  href="#privacy"
                >
                  Privacidad
                </a>
                .
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setTermsVisible(false)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider text-black bg-white hover:bg-slate-200 transition-all cursor-pointer font-medium"
              >
                Entendido
              </button>
              <button
                type="button"
                aria-label="Descartar aviso de términos"
                onClick={() => setTermsVisible(false)}
                className="text-slate-400 hover:text-white text-xs transition-colors cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
