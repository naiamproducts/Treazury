/**
 * PayStyle — Landing Page
 *
 * Arc Light mode. Dashboard archetype para el comerciante venezolano.
 * Estructura: Navbar → Hero → Features → How it works → CTA → Footer
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Zap,
  ShieldCheck,
  BarChart3,
  Package,
  FileText,
  ArrowRight,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'

interface LandingPageProps {
  onEnterApp: () => void
  showRegister: boolean
}

// ─── Fade-in wrapper ────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({
  onEnterApp,
  showRegister,
}: {
  onEnterApp: () => void
  showRegister: boolean
}) {
  return (
    <nav
      style={{
        background: 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--ink)' }}
          >
            <MessageCircle size={16} color="white" strokeWidth={2.5} />
          </div>
          <span
            className="display text-lg font-bold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            PayStyle
          </span>
        </div>

        <div className="flex items-center gap-3">
          {showRegister && (
            <button
              onClick={onEnterApp}
              className="text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Iniciar sesión
            </button>
          )}
          <button
            onClick={onEnterApp}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--ink)' }}
            onMouseEnter={e =>
              ((e.currentTarget).style.background =
                'var(--accent-hover)')
            }
            onMouseLeave={e =>
              ((e.currentTarget).style.background =
                'var(--ink)')
            }
          >
            {showRegister ? 'Crear cuenta' : 'Acceder'}
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── Feature card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--surface-strong)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: 'var(--surface-muted)' }}
      >
        {icon}
      </div>
      <p
        className="mb-1.5 text-sm font-semibold"
        style={{ color: 'var(--ink)' }}
      >
        {title}
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        {description}
      </p>
    </div>
  )
}

// ─── Step item ───────────────────────────────────────────────────────────────

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: 'var(--ink)' }}
        >
          {number}
        </div>
        {number < 4 && (
          <div
            className="mt-1 w-px flex-1"
            style={{ background: 'var(--border)', minHeight: '32px' }}
          />
        )}
      </div>
      <div className="pb-6">
        <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {title}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted)' }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LandingPage({ onEnterApp, showRegister }: LandingPageProps) {
  const [hoverCta, setHoverCta] = useState(false)

  const features = [
    {
      icon: <MessageCircle size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Cobros por WhatsApp',
      description:
        'Genera un link de pago en segundos y compártelo directo en tu conversación de WhatsApp. Tu cliente paga sin instalar nada.',
    },
    {
      icon: <Zap size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Liquidación instantánea',
      description:
        'Los pagos en USDC llegan en segundos a tu wallet. Sin esperas de 3 días, sin chargebacks, sin intermediarios bancarios.',
    },
    {
      icon: <Package size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Catálogo y stock',
      description:
        'Administra tus productos con variantes, unidades de medida y stock en tiempo real. Crea pedidos directamente desde el catálogo.',
    },
    {
      icon: <FileText size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Facturación venezolana',
      description:
        'Genera facturas con RIF, IVA 16% e IGTF 3% para pagos en divisas. Conforme con los requisitos del SENIAT.',
    },
    {
      icon: <ShieldCheck size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Pagos verificables',
      description:
        'Cada cobro tiene una dirección onchain única. Cualquier transferencia a esa dirección confirma el pago automáticamente.',
    },
    {
      icon: <BarChart3 size={20} style={{ color: 'var(--ink)' }} />,
      title: 'Panel del comerciante',
      description:
        'Historial de órdenes, estado de cada cobro en tiempo real, y acceso a tus fondos desde un solo lugar.',
    },
  ]

  const steps = [
    {
      title: 'Crea tu cuenta',
      description:
        'Conecta tu cuenta Circle y en segundos tienes una wallet de cobro lista para recibir USDC.',
    },
    {
      title: 'Agrega tus productos',
      description:
        'Carga tu catálogo con precios, variantes y stock. Una sola vez, lo usas en todos tus pedidos.',
    },
    {
      title: 'Crea el pedido y genera el link',
      description:
        'Selecciona los productos, ingresa los datos del comprador y presiona "Enviar por WhatsApp".',
    },
    {
      title: 'Tu cliente paga y listo',
      description:
        'El comprador abre el link, transfiere el USDC desde cualquier wallet o exchange, y el pago se confirma al instante.',
    },
  ]

  const benefits = [
    'Sin cuenta bancaria ni requisitos',
    'Precio fijo en USDC, sin volatilidad',
    'Factura automática con IVA e IGTF',
    'Stock actualizado con cada venta',
    'Historial completo de tus cobros',
    'Funciona en cualquier teléfono',
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <Navbar onEnterApp={onEnterApp} showRegister={showRegister} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center">
        <FadeIn>
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'var(--surface-muted)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            Para proveedores mayoristas
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <h1
            className="display mx-auto mb-4 max-w-2xl text-4xl font-bold text-balance sm:text-5xl"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            Cobra tus pedidos de WhatsApp en USDC
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p
            className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-pretty"
            style={{ color: 'var(--muted)' }}
          >
            PayStyle convierte tu operación B2B por WhatsApp en un flujo profesional: catálogo, pedidos, factura y cobro en un solo lugar. El dinero llega directo a tu wallet en segundos.
          </p>
        </FadeIn>

        <FadeIn delay={0.14}>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onEnterApp}
              onMouseEnter={() => setHoverCta(true)}
              onMouseLeave={() => setHoverCta(false)}
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition-all"
              style={{
                background: hoverCta ? 'var(--accent-hover)' : 'var(--ink)',
                boxShadow: hoverCta
                  ? '0 8px 24px rgba(16,97,166,0.30)'
                  : '0 4px 16px rgba(18,45,69,0.18)',
              }}
            >
              {showRegister ? 'Crear cuenta gratis' : 'Entrar al panel'}
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <span className="text-sm" style={{ color: 'var(--subtle)' }}>
              Solo para Venezuela por ahora
            </span>
          </div>
        </FadeIn>

        {/* WhatsApp message mockup */}
        <FadeIn delay={0.2}>
          <div className="mx-auto mt-14 max-w-sm">
            <div
              className="rounded-2xl p-1.5"
              style={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 40px rgba(18,45,69,0.10)',
              }}
            >
              {/* Chat header */}
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: '#128C7E' }}
              >
                <div className="h-7 w-7 rounded-full bg-white/20" />
                <div>
                  <p className="text-xs font-semibold text-white">Luis M. — Gomería El Norte</p>
                  <p className="text-[10px] text-white/70">en línea</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2 p-3">
                {/* Incoming */}
                <div className="flex justify-start">
                  <div
                    className="max-w-[85%] rounded-xl rounded-tl-sm px-3 py-2 text-xs"
                    style={{ background: '#fff', border: '1px solid var(--border)' }}
                  >
                    <p style={{ color: 'var(--ink)' }}>
                      Necesito 4 neumáticos 205/55 R16 y 2 de 185/65 R15
                    </p>
                    <p className="mt-0.5 text-right text-[10px]" style={{ color: 'var(--subtle)' }}>
                      9:14
                    </p>
                  </div>
                </div>

                {/* Outgoing — payment link */}
                <div className="flex justify-end">
                  <div
                    className="max-w-[88%] rounded-xl rounded-tr-sm px-3 py-2 text-xs"
                    style={{ background: 'var(--ink)', color: 'white' }}
                  >
                    <p className="font-medium">Pedido #1042 — $347 USDC</p>
                    <p className="mt-0.5 text-white/70 text-[11px]">
                      4× 205/55 R16 Pirelli + 2× 185/65 R15
                    </p>
                    <div
                      className="mt-2 rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.18)' }}
                    >
                      Pagar ahora
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-white/50">
                      9:15 ✓✓
                    </p>
                  </div>
                </div>

                {/* Incoming — confirmation */}
                <div className="flex justify-start">
                  <div
                    className="max-w-[85%] rounded-xl rounded-tl-sm px-3 py-2 text-xs"
                    style={{ background: '#fff', border: '1px solid var(--border)' }}
                  >
                    <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Pago enviado. Gracias!
                    </p>
                    <p className="mt-0.5 text-right text-[10px]" style={{ color: 'var(--subtle)' }}>
                      9:16
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: 'var(--subtle)' }}>
              Así se ve para tu cliente
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: 'var(--surface-muted)', borderTop: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-5xl px-5">
          <FadeIn>
            <p
              className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--subtle)' }}
            >
              Todo lo que necesitas
            </p>
            <h2
              className="display mb-10 text-center text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
            >
              Un solo sistema para vender como profesional
            </h2>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.04}>
                <FeatureCard {...f} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <FadeIn>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--subtle)' }}
                >
                  Cómo funciona
                </p>
                <h2
                  className="display mb-8 text-2xl font-bold sm:text-3xl"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
                >
                  Listo para cobrar en menos de 5 minutos
                </h2>
              </FadeIn>

              {steps.map((step, i) => (
                <FadeIn key={step.title} delay={i * 0.06}>
                  <Step number={i + 1} {...step} />
                </FadeIn>
              ))}
            </div>

            {/* Benefits panel */}
            <FadeIn delay={0.1}>
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--surface-strong)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="display mb-5 text-lg font-bold"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
                >
                  Por qué PayStyle
                </p>
                <ul className="space-y-3">
                  {benefits.map(b => (
                    <li key={b} className="flex items-center gap-3">
                      <CheckCircle
                        size={17}
                        strokeWidth={2.5}
                        style={{ color: 'var(--success)', flexShrink: 0 }}
                      />
                      <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-6 rounded-xl p-4"
                  style={{ background: 'var(--surface-muted)' }}
                >
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--subtle)' }}
                  >
                    Ruta del dinero
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Tu cliente transfiere USDC directamente a una dirección única de tu pedido. El pago se confirma onchain en segundos, sin intermediarios.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section
        className="py-16 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="mx-auto max-w-xl px-5">
          <FadeIn>
            <h2
              className="display mb-3 text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
            >
              Empieza a cobrar hoy
            </h2>
            <p
              className="mb-8 text-sm leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              PayStyle está en acceso anticipado para proveedores venezolanos. Solicita tu acceso y te contactamos en 24 horas.
            </p>
          </FadeIn>
          <FadeIn delay={0.06}>
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition-all mx-auto"
              style={{
                background: 'var(--ink)',
                boxShadow: '0 4px 16px rgba(18,45,69,0.18)',
              }}
              onMouseEnter={e =>
                ((e.currentTarget).style.background =
                  'var(--accent-hover)')
              }
              onMouseLeave={e =>
                ((e.currentTarget).style.background = 'var(--ink)')
              }
            >
              {showRegister ? 'Solicitar acceso' : 'Ir al panel'}
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="py-8 text-center text-xs"
        style={{
          color: 'var(--subtle)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: 'var(--ink)' }}
            >
              <MessageCircle size={11} color="white" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
              PayStyle
            </span>
          </div>
          <span>Pagos en USDC · Arc Testnet · Venezuela</span>
          <span>Built on Circle</span>
        </div>
      </footer>
    </div>
  )
}
