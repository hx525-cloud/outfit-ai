'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shirt, Sparkles, Camera, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { WeatherCard } from '@/components/WeatherCard'
import { DailyOutfit } from '@/components/DailyOutfit'
import type { WeatherData } from '@/types'

const quickActions = [
  { href: '/wardrobe', label: '管理衣橱', icon: Shirt, color: 'bg-blue-500' },
  { href: '/recommend', label: '获取推荐', icon: Sparkles, color: 'bg-purple-500' },
  { href: '/try-on', label: '虚拟试衣', icon: Camera, color: 'bg-pink-500' },
]

export default function HomePage() {
  const { clothes, outfitHistory, loadData } = useAppStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">AI 穿搭推荐</h1>
        <p className="text-gray-500">让每天的穿搭都精彩</p>
      </div>

      {/* 天气和今日推荐 */}
      <div className="grid gap-4 md:grid-cols-2">
        <WeatherCard onWeatherLoad={setWeather} />
        <DailyOutfit weather={weather} />
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-3 gap-4">
        {quickActions.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center py-6">
                <div className={`${color} p-3 rounded-full mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{clothes.length}</CardTitle>
            <CardDescription>衣橱衣物</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{outfitHistory.length}</CardTitle>
            <CardDescription>穿搭记录</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 最近穿搭 */}
      {outfitHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              最近穿搭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outfitHistory.slice(0, 3).map((history) => (
                <div key={history.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{history.occasion}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(history.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态引导 */}
      {clothes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-8">
            <Shirt className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">衣橱还是空的，快来添加衣物吧！</p>
            <Link href="/wardrobe">
              <Button>添加第一件衣物</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
