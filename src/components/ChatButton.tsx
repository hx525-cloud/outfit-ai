'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatDialog } from './ChatDialog'

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 浮动按钮 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* 对话框 */}
      <ChatDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
