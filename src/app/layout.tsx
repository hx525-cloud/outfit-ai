import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/sonner'
import { ChatButton } from '@/components/ChatButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI 穿搭推荐',
  description: '智能穿搭推荐系统，让每天的穿搭都精彩',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen pb-20 md:pt-20 md:pb-0">
          <Navbar />
          <main className="max-w-screen-xl mx-auto px-4 py-6">
            {children}
          </main>
        </div>
        <Toaster />
        <ChatButton />
      </body>
    </html>
  )
}
