'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Shirt, Sparkles, Camera, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/wardrobe', label: '衣橱', icon: Shirt },
  { href: '/recommend', label: '推荐', icon: Sparkles },
  { href: '/try-on', label: '试衣', icon: Camera },
  { href: '/profile', label: '我的', icon: User },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-8 h-16">
          <Link href="/" className="hidden md:block font-bold text-xl text-primary">
            AI 穿搭
          </Link>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors',
                pathname === href
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs md:text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
