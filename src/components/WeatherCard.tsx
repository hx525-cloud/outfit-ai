'use client'

import { useState, useEffect } from 'react'
import { MapPin, Droplets, Wind, RefreshCw, Loader2, Thermometer, Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getWeather, getWeatherIconUrl, getClothingLevel } from '@/lib/weather'
import type { WeatherData } from '@/types'

interface WeatherCardProps {
  onWeatherLoad?: (weather: WeatherData) => void
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

// 根据天气获取装饰图标
function WeatherDecoration({ text }: { text: string }) {
  const iconClass = "w-16 h-16 opacity-15 absolute -right-2 -top-2"
  if (text.includes('晴')) return <Sun className={iconClass} />
  if (text.includes('云') || text.includes('阴')) return <Cloud className={iconClass} />
  if (text.includes('雨')) return <CloudRain className={iconClass} />
  if (text.includes('雪')) return <CloudSnow className={iconClass} />
  if (text.includes('雷')) return <CloudLightning className={iconClass} />
  return <Sun className={iconClass} />
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

export function WeatherCard({ onWeatherLoad }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      if (forceRefresh) {
        localStorage.removeItem('outfit-weather-cache')
      }
      const data = await getWeather()
      setWeather(data)
      onWeatherLoad?.(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取天气失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
  }, [])

  if (loading) {
    return (
      <Card className="overflow-hidden h-full">
        <CardContent className="flex items-center justify-center py-12 bg-gradient-to-br from-sky-400 to-blue-300 h-full">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <span className="text-sm font-medium">获取天气中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="overflow-hidden h-full">
        <CardContent className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-gray-400 to-gray-300 h-full">
          <Cloud className="w-12 h-12 text-white/60 mb-3" />
          <p className="text-white/80 mb-3 text-sm">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchWeather()} className="shadow-lg">
            <RefreshCw className="w-4 h-4 mr-1" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  const { current, forecast, location } = weather
  const clothingLevel = getClothingLevel(current.temp)
  const clothingStyle = getClothingStyle(clothingLevel)
  const gradient = getWeatherGradient(current.text)

  return (
    <Card className="overflow-hidden shadow-md h-full">
      {/* 主天气区域 - 渐变背景 */}
      <div className={`relative bg-gradient-to-br ${gradient} p-4 text-white`}>
        <WeatherDecoration text={current.text} />

        {/* 顶部：位置和刷新 */}
        <div className="flex items-center justify-between mb-2 relative z-10">
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
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-4xl font-bold tracking-tight">
              {current.temp}°
            </div>
            <div className="text-base font-medium opacity-90">{current.text}</div>
          </div>
          <img
            src={getWeatherIconUrl(current.icon)}
            alt={current.text}
            className="w-16 h-16 drop-shadow-lg"
          />
        </div>

        {/* 底部：详细信息 */}
        <div className="flex items-center gap-2 mt-2 relative z-10 flex-wrap">
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

      <CardContent className="p-3 space-y-3">
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

        {/* 未来3天预报 */}
        <div className="grid grid-cols-3 gap-2">
          {forecast.map((day, index) => (
            <div
              key={day.date}
              className={`text-center p-2 rounded-lg transition-all hover:scale-105 ${
                index === 0 ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500">
                {index === 0 ? '今天' : new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <img
                src={getWeatherIconUrl(day.iconDay)}
                alt={day.textDay}
                className="w-8 h-8 mx-auto my-1"
              />
              <div className="text-xs font-medium">
                <span className="text-blue-500">{day.tempMin}°</span>
                <span className="mx-0.5 text-gray-300">/</span>
                <span className="text-orange-500">{day.tempMax}°</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
