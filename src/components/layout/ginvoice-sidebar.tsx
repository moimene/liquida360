import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { isGInvoiceEnabled } from '@/lib/feature-flags'
import {
  LayoutDashboard,
  Upload,
  Landmark,
  ShieldCheck,
  FileStack,
  FileOutput,
  Send,
  CircleDollarSign,
  MonitorSmartphone,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Users,
} from 'lucide-react'
import type { GInvoiceRole } from '@/types'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles?: GInvoiceRole[]
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', path: '/g-invoice', icon: LayoutDashboard },
  { label: 'Subidas', path: '/g-invoice/intake', icon: Upload },
  { label: 'UTTAI', path: '/g-invoice/uttai', icon: ShieldCheck },
  {
    label: 'Contabilización',
    path: '/g-invoice/accounting',
    icon: Landmark,
    roles: ['ginv_bpo_proveedores', 'ginv_admin'],
  },
  {
    label: 'Para facturar',
    path: '/g-invoice/billing',
    icon: FileStack,
    roles: ['ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_admin'],
  },
  {
    label: 'Facturas',
    path: '/g-invoice/invoices',
    icon: FileOutput,
    roles: ['ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_admin'],
  },
  {
    label: 'Entregas',
    path: '/g-invoice/delivery',
    icon: Send,
    roles: ['ginv_bpo_facturacion', 'ginv_admin'],
  },
  {
    label: 'CxC / Recobro',
    path: '/g-invoice/collections',
    icon: CircleDollarSign,
    roles: ['ginv_bpo_facturacion', 'ginv_socio_aprobador', 'ginv_admin'],
  },
  {
    label: 'Plataformas',
    path: '/g-invoice/platforms',
    icon: MonitorSmartphone,
    roles: ['ginv_bpo_facturacion', 'ginv_admin'],
  },
]

const masterDataNav: NavItem[] = [
  { label: 'Jobs / Clientes', path: '/g-invoice/jobs', icon: Briefcase },
  { label: 'Proveedores', path: '/g-invoice/vendors', icon: Users },
]

const adminNav: NavItem[] = [
  { label: 'Configuración', path: '/g-invoice/settings', icon: Settings, roles: ['ginv_admin'] },
]

interface GInvoiceSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function GInvoiceSidebar({ collapsed, onToggle }: GInvoiceSidebarProps) {
  const { user, ginvRole, signOut } = useAuth()
  const navigate = useNavigate()

  function canAccess(item: NavItem): boolean {
    if (!isGInvoiceEnabled(user)) return false
    if (!item.roles) return true
    return !!ginvRole && item.roles.includes(ginvRole)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className="flex flex-col h-screen transition-all"
      style={{
        width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        backgroundColor: 'hsl(var(--sidebar-background))',
        borderRight: '1px solid hsl(var(--sidebar-border) / 0.5)',
        transition: 'width var(--g-transition-smooth)',
      }}
      aria-label="Navegación G-Invoice"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-6"
        style={{ borderBottom: '1px solid hsl(var(--sidebar-border) / 0.5)' }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center font-bold text-sm"
          style={{
            backgroundColor: 'hsl(var(--sidebar-accent))',
            color: 'hsl(var(--sidebar-accent-foreground))',
            borderRadius: 'var(--g-radius-sm)',
          }}
        >
          GI
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div
              className="font-bold text-sm truncate"
              style={{ color: 'hsl(var(--sidebar-foreground))' }}
            >
              G-INVOICE
            </div>
            <div
              className="text-xs truncate"
              style={{ color: 'hsl(var(--sidebar-foreground) / 0.7)' }}
            >
              Facturación digital
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span
              className="px-3 mb-2 text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
            >
              Navegación
            </span>
          )}
          {mainNav.filter(canAccess).map((item) => (
            <GInvoiceSidebarItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>

        {masterDataNav.filter(canAccess).length > 0 && (
          <div className="flex flex-col gap-1 mt-6">
            {!collapsed && (
              <span
                className="px-3 mb-2 text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
              >
                Datos maestros
              </span>
            )}
            {masterDataNav.filter(canAccess).map((item) => (
              <GInvoiceSidebarItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}

        {adminNav.filter(canAccess).length > 0 && (
          <div className="flex flex-col gap-1 mt-6">
            {!collapsed && (
              <span
                className="px-3 mb-2 text-[10px] font-medium uppercase tracking-wider"
                style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
              >
                Administración
              </span>
            )}
            {adminNav.filter(canAccess).map((item) => (
              <GInvoiceSidebarItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid hsl(var(--sidebar-border) / 0.5)' }}
      >
        <div className="mb-2">
          <GInvoiceSidebarItem
            item={{ label: 'Seguridad', path: '/security', icon: Shield }}
            collapsed={collapsed}
          />
        </div>

        {!collapsed && user && (
          <div className="mb-3 px-2">
            <div className="text-sm truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
              {user.email}
            </div>
            {ginvRole && (
              <span
                className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium uppercase"
                style={{
                  backgroundColor: 'hsl(var(--sidebar-accent))',
                  color: 'hsl(var(--sidebar-accent-foreground))',
                  borderRadius: 'var(--g-radius-full)',
                }}
              >
                {ginvRole.replace('ginv_', '')}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors',
            collapsed && 'justify-center',
          )}
          style={{
            color: 'hsl(var(--sidebar-foreground) / 0.8)',
            borderRadius: 'var(--g-radius-md)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(0 84% 60% / 0.2)'
            e.currentTarget.style.color = 'hsl(0, 84%, 75%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'hsl(var(--sidebar-foreground) / 0.8)'
          }}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 transition-colors"
        style={{
          borderTop: '1px solid hsl(var(--sidebar-border) / 0.5)',
          color: 'hsl(var(--sidebar-foreground) / 0.6)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'hsl(var(--sidebar-foreground))'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'hsl(var(--sidebar-foreground) / 0.6)'
        }}
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}

function GInvoiceSidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/g-invoice'}
      className={() =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
          collapsed && 'justify-center',
        )
      }
      style={({ isActive }) => ({
        backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'transparent',
        color: isActive
          ? 'hsl(var(--sidebar-accent-foreground))'
          : 'hsl(var(--sidebar-foreground) / 0.8)',
        fontWeight: isActive ? 500 : 400,
        borderRadius: 'var(--g-radius-md)',
      })}
      onMouseEnter={(e) => {
        const link = e.currentTarget
        if (!link.classList.contains('active')) {
          link.style.backgroundColor = 'hsl(var(--sidebar-accent) / 0.5)'
          link.style.color = 'hsl(var(--sidebar-foreground))'
        }
      }}
      onMouseLeave={(e) => {
        const link = e.currentTarget
        const isActive = link.getAttribute('aria-current') === 'page'
        if (!isActive) {
          link.style.backgroundColor = 'transparent'
          link.style.color = 'hsl(var(--sidebar-foreground) / 0.8)'
        }
      }}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}
