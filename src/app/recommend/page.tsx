'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles, Loader2, MapPin, Thermometer, Droplets, Wind, RefreshCw, Cloud, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { getOutfitRecommendations } from '@/lib/gemini'
import { generateId } from '@/lib/utils'
import { getWeather, getWeatherIconUrl, getClothingLevel } from '@/lib/weather'
import type { Clothing, OutfitRecommendation, WeatherData } from '@/types'

// 缓存相关常量和类型
const CACHE_KEY = 'outfit-recommendations-cache'
const LAST_OCCASION_KEY = 'outfit-last-occasion'

interface CachedRecommendation {
  date: string // YYYY-MM-DD
  occasion: string
  recommendations: OutfitRecommendation[]
  weather: { temp: number; text: string }
  cachedAt: number
}

interface RecommendationsCache {
  [occasion: string]: CachedRecommendation
}

// 获取今天的日期字符串（使用本地时间，避免UTC时区问题）
function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从缓存获取推荐
function getCachedRecommendations(occasion: string): CachedRecommendation | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const cache: RecommendationsCache = JSON.parse(cached)
    const data = cache[occasion]

    if (!data) return null

    // 检查是否是今天的缓存
    const today = getTodayString()
    if (data.date !== today) {
      // 清除过期缓存（读取时不写回，避免副作用）
      return null
    }

    return data
  } catch {
    return null
  }
}

// 保存推荐到缓存
function cacheRecommendations(
  occasion: string,
  recommendations: OutfitRecommendation[],
  weather: { temp: number; text: string }
): boolean {
  if (typeof window === 'undefined') return false

  try {
    let cache: RecommendationsCache = {}

    const existing = localStorage.getItem(CACHE_KEY)
    if (existing) {
      try {
        cache = JSON.parse(existing)
        // 清除过期的缓存条目
        const today = getTodayString()
        Object.keys(cache).forEach((key) => {
          if (cache[key].date !== today) {
            delete cache[key]
          }
        })
      } catch {
        cache = {}
      }
    }

    cache[occasion] = {
      date: getTodayString(),
      occasion,
      recommendations,
      weather,
      cachedAt: Date.now(),
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return true
  } catch {
    // localStorage 写入失败（配额满、隐私模式等）
    return false
  }
}

// 衣物缩略图组件
function ClothingThumbnail({ clothing }: { clothing: Clothing }) {
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
    <div className="flex-shrink-0 w-20">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={clothing.name || clothing.type}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            {clothing.type}
          </div>
        )}
      </div>
      <p className="text-xs text-center mt-1 truncate">{clothing.name || clothing.type}</p>
    </div>
  )
}

// 根据天气文字获取背景渐变
function getWeatherGradient(text: string): string {
  if (text.includes('晴')) return 'from-orange-400 via-amber-300 to-yellow-200'
  if (text.includes('云') || text.includes('阴')) return 'from-slate-400 via-slate-300 to-gray-200'
  if (text.includes('雨')) return 'from-blue-500 via-blue-400 to-cyan-300'
  if (text.includes('雪')) return 'from-blue-200 via-slate-200 to-white'
  if (text.includes('雷')) return 'from-purple-600 via-purple-400 to-indigo-300'
  if (text.includes('雾') || text.includes('霾')) return 'from-gray-400 via-gray-300 to-gray-200'
  return 'from-sky-400 via-sky-300 to-blue-200'
}

// 穿衣等级对应的颜色和 emoji
function getClothingStyle(level: string): { color: string; emoji: string } {
  switch (level) {
    case '炎热': return { color: 'bg-red-500', emoji: '🥵' }
    case '温暖': return { color: 'bg-orange-400', emoji: '😎' }
    case '舒适': return { color: 'bg-green-400', emoji: '😊' }
    case '微凉': return { color: 'bg-cyan-400', emoji: '🙂' }
    case '凉爽': return { color: 'bg-blue-400', emoji: '😌' }
    case '寒冷': return { color: 'bg-indigo-500', emoji: '🥶' }
    case '严寒': return { color: 'bg-purple-600', emoji: '❄️' }
    default: return { color: 'bg-gray-400', emoji: '🌡️' }
  }
}

const occasions = ['日常', '工作', '约会', '运动', '聚会', '正式场合']

// 获取上次选择的场合
function getLastOccasion(): string {
  if (typeof window === 'undefined') return '日常'
  return localStorage.getItem(LAST_OCCASION_KEY) || '日常'
}

// 保存选择的场合
function saveLastOccasion(occasion: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_OCCASION_KEY, occasion)
}

// 初始化时从缓存获取推荐（用于 useState 初始值）
function getInitialRecommendations(occasion: string): {
  recommendations: OutfitRecommendation[]
  isFromCache: boolean
  cacheTime: number | null
} {
  if (typeof window === 'undefined') {
    return { recommendations: [], isFromCache: false, cacheTime: null }
  }
  const cached = getCachedRecommendations(occasion)
  if (cached) {
    return {
      recommendations: cached.recommendations,
      isFromCache: true,
      cacheTime: cached.cachedAt,
    }
  }
  return { recommendations: [], isFromCache: false, cacheTime: null }
}

export default function RecommendPage() {
  const { clothes, userProfile, loadData, addOutfitHistory } = useAppStore()
  const [occasion, setOccasion] = useState('日常')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([])
  const [isFromCache, setIsFromCache] = useState(false)
  const [cacheTime, setCacheTime] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 组件挂载时初始化
  useEffect(() => {
    loadData()
    fetchWeather()

    // 恢复上次选择的场合并加载缓存
    const lastOccasion = getLastOccasion()
    const initial = getInitialRecommendations(lastOccasion)

    // 批量更新状态
    setOccasion(lastOccasion)
    setRecommendations(initial.recommendations)
    setIsFromCache(initial.isFromCache)
    setCacheTime(initial.cacheTime)
    setIsInitialized(true)
  }, [loadData])

  // 场合改变时加载对应缓存并保存选择（仅在初始化完成后）
  useEffect(() => {
    if (!isInitialized) return

    // 保存选择的场合
    saveLastOccasion(occasion)

    const cached = getCachedRecommendations(occasion)
    if (cached) {
      setRecommendations(cached.recommendations)
      setIsFromCache(true)
      setCacheTime(cached.cachedAt)
    } else {
      setRecommendations([])
      setIsFromCache(false)
      setCacheTime(null)
    }
  }, [occasion, isInitialized])

  const fetchWeather = async (forceRefresh = false) => {
    setWeatherLoading(true)
    setWeatherError(null)
    try {
      if (forceRefresh) {
        localStorage.removeItem('outfit-weather-cache')
      }
      const data = await getWeather()
      setWeather(data)
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : '获取天气失败')
    } finally {
      setWeatherLoading(false)
    }
  }

  const handleGetRecommendations = async (forceRefresh = false) => {
    if (!userProfile) {
      toast.error('请先完善个人资料')
      return
    }
    if (clothes.length < 3) {
      toast.error('衣橱衣物太少，请先添加更多衣物')
      return
    }
    if (!weather) {
      toast.error('天气数据加载中，请稍候')
      return
    }

    // 如果不是强制刷新，先检查缓存
    if (!forceRefresh) {
      const cached = getCachedRecommendations(occasion)
      if (cached) {
        setRecommendations(cached.recommendations)
        setIsFromCache(true)
        setCacheTime(cached.cachedAt)
        toast.success('已加载缓存的推荐')
        return
      }
    }

    setIsLoading(true)
    setIsFromCache(false)
    try {
      const results = await getOutfitRecommendations(
        clothes,
        userProfile,
        occasion,
        weather.current.temp,
        weather.current.text
      )
      setRecommendations(results)
      // 保存到缓存，同时保存当前场合
      const cached = cacheRecommendations(occasion, results, {
        temp: weather.current.temp,
        text: weather.current.text,
      })
      if (cached) {
        saveLastOccasion(occasion)
      }
      setCacheTime(Date.now())
      toast.success('推荐生成成功！')
    } catch (error) {
      toast.error(`推荐失败: ${String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOutfit = (rec: OutfitRecommendation) => {
    addOutfitHistory({
      id: generateId(),
      clothingIds: rec.clothingIds,
      occasion: rec.occasion,
      weather: weather?.current.text,
      temperature: weather?.current.temp,
      aiSuggestion: rec.reason,
      createdAt: new Date(),
    })
    toast.success('已保存到穿搭历史！')
  }

  const getClothingById = (id: string) => clothes.find((c) => c.id === id)

  // 格式化缓存时间
  const formatCacheTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 渲染天气卡片内容
  const renderWeatherCard = () => {
    if (weatherLoading) {
      return (
        <Card className="overflow-hidden">
          <CardContent className="flex items-center justify-center py-12 bg-gradient-to-br from-sky-400 to-blue-300">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <span className="text-sm font-medium">获取天气中...</span>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (weatherError) {
      return (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-gray-400 to-gray-300">
            <Cloud className="w-12 h-12 text-white/60 mb-3" />
            <p className="text-white/80 mb-3 text-sm">{weatherError}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchWeather(true)} className="shadow-lg">
              <RefreshCw className="w-4 h-4 mr-1" />
              重试
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (!weather) return null

    const { current, location } = weather
    const clothingLevel = getClothingLevel(current.temp)
    const clothingStyle = getClothingStyle(clothingLevel)
    const gradient = getWeatherGradient(current.text)

    return (
      <Card className="overflow-hidden shadow-md">
        {/* 天气信息区域 */}
        <div className={`relative bg-gradient-to-br ${gradient} p-4 text-white`}>
          {/* 顶部：位置和刷新 */}
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-medium">{location}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white"
              onClick={() => fetchWeather(true)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* 中间：温度和天气图标 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold tracking-tight">{current.temp}°</div>
              <div className="text-base font-medium opacity-90">{current.text}</div>
            </div>
            <img
              src={getWeatherIconUrl(current.icon)}
              alt={current.text}
              className="w-16 h-16 drop-shadow-lg"
            />
          </div>

          {/* 底部：详细信息 */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Thermometer className="w-3 h-3" />
              <span className="text-xs">体感 {current.feelsLike}°</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Droplets className="w-3 h-3" />
              <span className="text-xs">{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <Wind className="w-3 h-3" />
              <span className="text-xs">{current.windDir} {current.windScale}级</span>
            </div>
          </div>
        </div>

        {/* 场合选择和推荐按钮 */}
        <CardContent className="p-4 space-y-4">
          {/* 穿衣建议 */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{clothingStyle.emoji}</span>
              <div>
                <div className="text-xs text-gray-500">穿衣指数</div>
                <div className="font-semibold text-sm">{clothingLevel}</div>
              </div>
            </div>
            <div className={`${clothingStyle.color} text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm`}>
              {current.temp >= 25 ? '轻薄透气' : current.temp >= 15 ? '适当添衣' : '注意保暖'}
            </div>
          </div>

          {/* 场合选择 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">今天的场合</label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    occasion === o
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* 推荐按钮 */}
          <Button
            onClick={() => handleGetRecommendations(false)}
            disabled={isLoading || !weather}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            获取 AI 穿搭推荐
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">穿搭推荐</h1>

      {/* 天气和场合选择卡片 */}
      {renderWeatherCard()}

      {/* 推荐结果 */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">为你推荐</h2>
            <div className="flex items-center gap-2">
              {isFromCache && cacheTime && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatCacheTime(cacheTime)} 缓存
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGetRecommendations(true)}
                disabled={isLoading}
                className="h-7"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                重新推荐
              </Button>
            </div>
          </div>
          {recommendations.map((rec, index) => (
            <Card key={rec.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>方案 {index + 1}</span>
                  <span className="text-sm font-normal text-primary">{rec.score}分</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 衣物展示 */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {rec.clothingIds.map((id) => {
                    const clothing = getClothingById(id)
                    if (!clothing) return null
                    return <ClothingThumbnail key={id} clothing={clothing} />
                  })}
                </div>
                {/* 推荐理由 */}
                <p className="text-sm text-gray-600">{rec.reason}</p>
                <Button variant="outline" onClick={() => handleSaveOutfit(rec)} className="w-full">
                  保存这套搭配
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {recommendations.length === 0 && !isLoading && weather && (
        <div className="text-center py-12 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>选择今天的场合，让 AI 为你推荐穿搭吧！</p>
        </div>
      )}
    </div>
  )
}
