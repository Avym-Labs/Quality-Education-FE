import { useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ConversationSidebar from '../../components/chat/ConversationSidebar'

export default function ChatList() {
  useEffect(() => {
    // Lock body scroll to prevent page double scrollbars
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <DashboardLayout fixedHeight={true} noPadding={true}>
      <div className="flex flex-1 overflow-hidden h-full min-h-0">

        {/* Left Pane: Scrollable conversations list (visible everywhere on /chat route) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 h-full">
          <ConversationSidebar activeConversationId={null} />
        </div>

        {/* Right Pane: Conversation active room placeholder (hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-[#F5F3FB] text-outline space-y-3.5">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 0" }}>forum</span>
          </div>
          <div className="text-center max-w-sm space-y-1">
            <h3 className="text-sm font-bold text-on-surface">Your Direct Messages</h3>
            <p className="text-xs text-outline leading-relaxed">
              Select an active conversation from the sidebar or start a new message chat thread.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
