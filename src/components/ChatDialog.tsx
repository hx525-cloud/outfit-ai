'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store'
import { chatWithAI } from '@/lib/gemini'
import { addChatMessage, getChatMessages, clearChatMessages } from '@/lib/db'
import { getCachedWeather } from '@/lib/weather'
import { generateId } from '@/lib/utils'
import type { ChatMessage } from '@/types'

const QUICK_QUESTIONS = [
  '今天穿什么？',
  '约会穿搭推荐',
  '面试穿什么好？',
  '休闲风格搭配',
]

interface ChatDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatDialog({ isOpen, onClose }: ChatDialogProps) {
  const { clothes, userProfile } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载历史消息
  useEffect(() => {
    if (isOpen) {
      getChatMessages().then(setMessages)
    }
  }, [isOpen])

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      await addChatMessage(userMsg)

      const weather = getCachedWeather()
      const weatherInfo = weather ? { temp: weather.current.temp, text: weather.current.text } : null

      const response = await chatWithAI(
        content,
        clothes,
        userProfile,
        weatherInfo,
        messages.map((m) => ({ role: m.role, content: m.content }))
      )

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      await addChatMessage(assistantMsg)
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '抱歉，我暂时无法回答。请稍后再试。',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    await clearChatMessages()
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <Card className="fixed bottom-40 right-4 md:bottom-24 md:right-6 w-80 md:w-96 shadow-xl z-40 max-h-[60vh] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center justify-between text-base">
          <span>AI 穿搭助手</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-3">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[200px]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              <p className="mb-3">你好！我是你的穿搭助手</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map((q) => (
                  <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => sendMessage(q)}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 快捷问题（有消息时显示在底部） */}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {QUICK_QUESTIONS.slice(0, 2).map((q) => (
              <Button key={q} variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => sendMessage(q)}>
                {q}
              </Button>
            ))}
          </div>
        )}

        {/* 输入框 */}
        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="输入你的问题..."
            className="flex-1"
            disabled={loading}
          />
          <Button size="icon" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
