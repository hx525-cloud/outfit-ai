'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import { getDailyRecommendation } from '@/lib/gemini'
import type { WeatherData, DailyRecommendation, Clothing } from '@/types'

const CACHE_KEY = 'outfit-daily-recommendation'

// 衣物缩略图组件
function ClothingMiniThumbnail({ clothing }: { clothing: Clothing }) {
  const imageUrl = useMemo(() => {
    if (clothing.thumbnailBlob) {
      return URL.createObjectURL(clothing.thumbnailBlob)
    }
    return null
  }, [clothing.thumbnailBlob])

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  return (
    <div className="flex-shrink-0 w-14">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={clothing.name || clothing.type}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            {clothing.type.slice(0, 2)}
          </div>
        )}
      </div>
      <p className="text-xs text-center mt-1 truncate text-gray-600">{clothing.name || clothing.type}</p>
    </div>
  )
}

interface DailyOutfitProps {
  weather: WeatherData | null
}

export function DailyOutfit({ weather }: DailyOutfitProps) {
  const { clothes, userProfile } = useAppStore()
  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCachedRecommendation = (): DailyRecommendation | null => {
    if (typeof window === 'undefined') return null
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    try {
      const data: DailyRecommendation = JSON.parse(cached)
      const today = new Date().toISOString().split('T')[0]
      if (data.date === today) return data
      localStorage.removeItem(CACHE_KEY)
      return null
    } catch {
      return null
    }
  }

  const fetchRecommendation = async (forceRefresh = false) => {
    if (!weather || clothes.length === 0) return

    if (!forceRefresh) {
      const cached = getCachedRecommendation()
      if (cached) {
        setRecommendation(cached)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getDailyRecommendation(clothes, userProfile, weather.current)
      const data: DailyRecommendation = {
        date: new Date().toISOString().split('T')[0],
        recommendation: result.recommendation,
        clothingIds: result.clothingIds,
        weather: weather.current,
        cachedAt: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      setRecommendation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取推荐失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (weather && clothes.length > 0) {
      fetchRecommendation()
    }
  }, [weather, clothes.length])

  if (!weather) return null

  if (clothes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-500" />
            今日穿搭推荐
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-4">添加衣物后即可获取智能穿搭推荐</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            今日穿搭推荐
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchRecommendation(true)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500 text-sm">AI正在为你搭配...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchRecommendation(true)}>重试</Button>
          </div>
        ) : recommendation ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">{recommendation.recommendation}</p>
            {recommendation.clothingIds.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recommendation.clothingIds.map((id) => {
                  const item = clothes.find((c) => c.id === id)
                  return item ? <ClothingMiniThumbnail key={id} clothing={item} /> : null
                })}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
