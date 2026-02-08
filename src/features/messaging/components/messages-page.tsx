import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { InfoTip } from '@/components/ui/info-tip'
import { useAuth } from '@/features/auth'
import { useConversations, type ConversationWithDetails } from '../hooks/use-conversations'
import { useUsersList } from '../hooks/use-users-list'
import { MESSAGING_HELP } from '../constants/help-texts'
import { ConversationList } from './conversation-list'
import { ConversationDetail } from './conversation-detail'
import { NewConversationDialog } from './new-conversation-dialog'

export function MessagesPage() {
  const user = useAuth((s) => s.user)
  const { conversations, loading, fetchConversations, createConversation, subscribeRealtime, unsubscribe } =
    useConversations()
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

  // Keep active conversation in sync with conversation list updates
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id)
      if (updated) {
        setActiveConversation(updated)
      }
    }
  }, [conversations, activeConversation])

  function handleSelectConversation(c: ConversationWithDetails) {
    setActiveConversation(c)
    setMobileShowDetail(true)
  }

  function handleBack() {
    setMobileShowDetail(false)
  }

  async function handleCreateConversation(
    participantIds: string[],
    title?: string,
    isGroup?: boolean,
  ) {
    if (!user?.id) return
    const convoId = await createConversation(user.id, participantIds, title, isGroup)
    if (convoId) {
      // Find the newly created conversation in the refreshed list
      const newConvo = useConversations.getState().conversations.find((c) => c.id === convoId)
      if (newConvo) {
        setActiveConversation(newConvo)
        setMobileShowDetail(true)
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Mobile-only header */}
      <div className="md:hidden px-4 py-3" style={{ borderBottom: '1px solid var(--g-border-default)' }}>
        <h1
          className="font-bold flex items-center gap-2"
          style={{ fontSize: 'var(--g-text-h2)', color: 'var(--g-text-primary)' }}
        >
          Mensajes
          <InfoTip content={MESSAGING_HELP.pageHeaderTip} side="bottom" />
        </h1>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list — hidden on mobile when detail is shown */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 ${mobileShowDetail ? 'hidden md:flex' : 'flex'} flex-col`}
          style={{
            borderRight: '1px solid var(--g-border-default)',
            backgroundColor: 'var(--g-surface-card)',
          }}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id ?? null}
            loading={loading}
            onSelect={handleSelectConversation}
            onNewConversation={() => setShowNewDialog(true)}
          />
        </div>

        {/* Conversation detail */}
        <div
          className={`flex-1 ${mobileShowDetail ? 'flex' : 'hidden md:flex'} flex-col`}
          style={{ backgroundColor: 'var(--g-surface-default)' }}
        >
          {activeConversation ? (
            <ConversationDetail
              conversation={activeConversation}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <MessageSquare
                className="h-16 w-16"
                style={{ color: 'var(--g-text-secondary)', opacity: 0.3 }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                Selecciona una conversación
              </p>
              <p
                className="text-sm max-w-xs text-center"
                style={{ color: 'var(--g-text-secondary)' }}
              >
                Elige una conversación de la lista o inicia una nueva para comenzar a enviar mensajes.
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
        onCreateConversation={handleCreateConversation}
      />
    </div>
  )
}
