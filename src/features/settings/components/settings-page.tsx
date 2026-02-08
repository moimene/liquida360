import { useState } from 'react'
import { Bell, Users, Settings, Shield, Plug } from 'lucide-react'
import { AlertConfigsTab } from './alert-configs-tab'
import { UsersTab } from './users-tab'
import { GeneralTab } from './general-tab'
import { SecurityManifestTab } from './security-manifest-tab'
import { IntegrationsTab } from './integrations-tab'

type SettingsTabId = 'alertas' | 'usuarios' | 'integraciones' | 'general' | 'seguridad'

const tabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'integraciones', label: 'Integraciones', icon: Plug },
  { id: 'general', label: 'General', icon: Settings },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('alertas')

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1
          className="font-bold"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Configuracion
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}
        >
          Gestion de alertas, usuarios y parametros del sistema.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-0"
        role="tablist"
        aria-label="Secciones de configuracion"
        style={{ borderBottom: '2px solid var(--g-border-default)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-[2px]"
              style={{
                color: isActive ? 'var(--g-brand-3308)' : 'var(--g-text-secondary)',
                borderBottom: isActive
                  ? '2px solid var(--g-brand-3308)'
                  : '2px solid transparent',
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'alertas' && <AlertConfigsTab />}
        {activeTab === 'usuarios' && <UsersTab />}
        {activeTab === 'integraciones' && <IntegrationsTab />}
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'seguridad' && <SecurityManifestTab />}
      </div>
    </div>
  )
}
