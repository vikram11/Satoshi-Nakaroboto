import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { AdminModal } from './components/AdminModal'
import { ShieldAlert } from 'lucide-react'

function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-display selection:bg-secondary/30 selection:text-secondary">

      {/* Header */}
      <header className="border-b border-neutral-900 p-4 sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-mono font-bold tracking-tighter text-secondary">
              SATOSHI_NAKAROBOTO
            </h1>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest hidden md:block">
              AI AVATAR OF THE INVENTOR OF BITCOIN
            </p>
          </div>
          <div className="flex gap-4 text-xs font-mono text-neutral-600">
            <span>GENESIS_BLOCK: 2009</span>
            <span className="hidden sm:inline">V1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        <ChatInterface />
      </main>

      {/* Footer / Hidden Admin Trigger */}
      <footer className="py-2 text-center text-[10px] text-neutral-800 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <span>Powered by Cryptography</span>

          {/* Subtle Admin Button */}
          {/* Admin Button */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="opacity-100 text-secondary/70 hover:text-secondary transition-colors p-1 flex items-center gap-2"
            title="System Configuration"
          >
            <ShieldAlert size={12} />
            <span className="font-mono">SYSTEM_CONFIG</span>
          </button>
        </div>
      </footer>

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  )
}

export default App
