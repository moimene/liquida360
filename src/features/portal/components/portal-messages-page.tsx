import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { InfoTip } from '@/components/ui/info-tip'
import { useAuth } from '@/features/auth'
import {
  useConversations,
  type ConversationWithDetails,
} from '@/features/messaging/hooks/use-conversations'
import { useUsersList } from '@/features/messaging/hooks/use-users-list'
import { MESSAGING_HELP } from '@/features/messaging/constants/help-texts'
import { ConversationList } from '@/features/messaging/components/conversation-list'
import { ConversationDetail } from '@/features/messaging/components/conversation-detail'
import { NewConversationDialog } from '@/features/messaging/components/new-conversation-dialog'

export function PortalMessagesPage() {
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.role)
  const {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    subscribeRealtime,
    unsubscribe,
  } = useConversations()
  const { users, fetchUsers } = useUsersList()

  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id)
      subscribeRealtime(user.id)
      fetchUsers()
    }
    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Keep active conversation in sync
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id)
      if (updated) setActiveConversation(updated)
    }
  }, [conversations, activeConversation])

  function handleSelectConversation(c: ConversationWithDetails) {
    setActiveConversation(c)
    setMobileShowDetail(true)
  }

  async function handleCreateConversation(
    participantIds: string[],
    title?: string,
    isGroup?: boolean,
  ) {
    if (!user?.id) return
    const convoId = await createConversation(user.id, participantIds, title, isGroup)
    if (convoId) {
      const newConvo = useConversations.getState().conversations.find((c) => c.id === convoId)
      if (newConvo) {
        setActiveConversation(newConvo)
        setMobileShowDetail(true)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1
          className="font-bold flex items-center gap-2"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Mensajes
          <InfoTip content={MESSAGING_HELP.portalHeaderTip} side="bottom" />
        </h1>
        <p style={{ fontSize: 'var(--g-text-body)', color: 'var(--g-text-secondary)' }}>
          Comunícate directamente con el equipo de gestión
        </p>
      </div>

      {/* Split panel in a card */}
      <div
        className="flex overflow-hidden"
        style={{
          height: '600px',
          border: '1px solid var(--g-border-default)',
          borderRadius: 'var(--g-radius-lg)',
          backgroundColor: 'var(--g-surface-card)',
        }}
      >
        {/* Conversation list */}
        <div
          className={`w-full md:w-80 shrink-0 ${mobileShowDetail ? 'hidden md:flex' : 'flex'} flex-col`}
          style={{ borderRight: '1px solid var(--g-border-default)' }}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id ?? null}
            loading={loading}
            onSelect={handleSelectConversation}
            onNewConversation={() => setShowNewDialog(true)}
          />
        </div>

        {/* Detail */}
        <div
          className={`flex-1 ${mobileShowDetail ? 'flex' : 'hidden md:flex'} flex-col`}
          style={{ backgroundColor: 'var(--g-surface-default)' }}
        >
          {activeConversation ? (
            <ConversationDetail
              conversation={activeConversation}
              onBack={() => setMobileShowDetail(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <MessageSquare
                className="h-12 w-12"
                style={{ color: 'var(--g-text-secondary)', opacity: 0.3 }}
              />
              <p className="text-sm" style={{ color: 'var(--g-text-secondary)' }}>
                Selecciona una conversación para ver los mensajes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New conversation dialog */}
      <NewConversationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        users={users}
        currentUserId={user?.id ?? ''}
        currentUserRole={role ?? undefined}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  )
}
