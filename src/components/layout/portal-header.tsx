import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { NotificationBell } from '@/features/notifications/components/notification-bell'
import {
  LayoutDashboard,
  Receipt,
  FileCheck,
  UserCircle,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface PortalNavItem {
  label: string
  path: string
  icon: React.ElementType
}

const portalNav: PortalNavItem[] = [
  { label: 'Inicio', path: '/portal', icon: LayoutDashboard },
  { label: 'Mis facturas', path: '/portal/invoices', icon: Receipt },
  { label: 'Certificados', path: '/portal/certificates', icon: FileCheck },
  { label: 'Mensajes', path: '/portal/messages', icon: MessageSquare },
  { label: 'Mi perfil', path: '/portal/profile', icon: UserCircle },
]

export function PortalHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--g-surface-card)',
        borderBottom: '1px solid var(--g-border-default)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/portal" className="flex items-center gap-2 shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: 'var(--g-brand-3308)',
                color: 'var(--g-text-inverse)',
                borderRadius: 'var(--g-radius-sm)',
              }}
            >
              L3
            </div>
            <span
              className="font-bold text-sm hidden sm:block"
              style={{ color: 'var(--g-brand-3308)' }}
            >
              LIQUIDA360
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegacion del portal">
            {portalNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/portal'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'border-b-2' : '',
                    )
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                    borderColor: isActive ? 'var(--g-brand-3308)' : 'transparent',
                    borderRadius: isActive ? '0' : 'var(--g-radius-sm)',
                  })}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Right side: notifications + user + logout */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center font-medium text-sm"
                  style={{
                    backgroundColor: 'var(--g-sec-100)',
                    color: 'var(--g-brand-3308)',
                    borderRadius: 'var(--g-radius-full)',
                  }}
                  aria-hidden="true"
                >
                  {user.email?.[0]?.toUpperCase() ?? 'C'}
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors"
              style={{
                color: 'var(--g-text-secondary)',
                borderRadius: 'var(--g-radius-sm)',
              }}
              aria-label="Cerrar sesion"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
              style={{ color: 'var(--g-text-primary)' }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav
            className="md:hidden pb-4 flex flex-col gap-1"
            aria-label="Navegacion del portal (movil)"
          >
            {portalNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/portal'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                    backgroundColor: isActive ? 'var(--g-surface-muted)' : 'transparent',
                    borderRadius: 'var(--g-radius-md)',
                  })}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 text-sm mt-2"
              style={{
                color: 'var(--status-error)',
                borderRadius: 'var(--g-radius-md)',
              }}
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesion
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
