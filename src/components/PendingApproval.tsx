/**
 * PayStyle — PendingApproval screen
 * Shown when the user registered but their tenant is not yet approved (whitelist).
 */

import { Clock, LogOut, MessageSquare } from 'lucide-react'

interface PendingApprovalProps {
  email: string
  businessName: string
  onSignOut: () => void
}

export default function PendingApproval({ email, businessName, onSignOut }: PendingApprovalProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 32px rgba(18,45,69,0.08)',
        }}
      >
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <MessageSquare className="size-7 text-white" />
        </div>

        <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
          Solicitud recibida
        </h1>

        <div
          className="mx-auto mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}
        >
          <Clock className="size-4 shrink-0" style={{ color: '#b45309' }} />
          <p className="text-sm" style={{ color: '#92400e' }}>
            Pendiente de aprobación
          </p>
        </div>

        <p className="mt-4 text-sm" style={{ color: 'var(--ink-2)' }}>
          Tu solicitud para <strong>{businessName}</strong> fue recibida.
          Recibirás un correo en <strong>{email}</strong> cuando tu cuenta sea activada.
        </p>

        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          PayStyle está en acceso anticipado. Estamos activando cuentas gradualmente
          para garantizar la calidad del servicio.
        </p>

        <button
          onClick={onSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink-2)',
            border: '1px solid var(--border)',
          }}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
