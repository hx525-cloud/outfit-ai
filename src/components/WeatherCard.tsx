'use client'

import { useState, useEffect } from 'react'
import { MapPin, Droplets, Wind, RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getWeather, getWeatherIconUrl, getClothingLevel } from '@/lib/weather'
import type { WeatherData } from '@/types'

interface WeatherCardProps {
  onWeatherLoad?: (weather: WeatherData) => void
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">获取天气中...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-6">
          <p className="text-gray-500 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchWeather()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!weather) return null

  const { current, forecast, location } = weather
  const clothingLevel = getClothingLevel(current.temp)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {location}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchWeather(true)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前天气 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={getWeatherIconUrl(current.icon)} alt={current.text} className="w-12 h-12" />
            <div>
              <div className="text-3xl font-bold">{current.temp}°C</div>
              <div className="text-sm text-gray-500">{current.text}</div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>体感 {current.feelsLike}°C</div>
            <div className="flex items-center gap-1 justify-end">
              <Droplets className="w-3 h-3" />{current.humidity}%
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Wind className="w-3 h-3" />{current.windDir} {current.windScale}级
            </div>
          </div>
        </div>

        {/* 穿衣建议等级 */}
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <span className="text-sm text-gray-600">穿衣指数：</span>
          <span className="font-medium text-primary ml-1">{clothingLevel}</span>
        </div>

        {/* 未来3天预报 */}
        <div className="grid grid-cols-3 gap-2">
          {forecast.map((day) => (
            <div key={day.date} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">
                {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <img src={getWeatherIconUrl(day.iconDay)} alt={day.textDay} className="w-8 h-8 mx-auto my-1" />
              <div className="text-xs">
                <span className="text-blue-500">{day.tempMin}°</span>
                <span className="mx-1">/</span>
                <span className="text-red-500">{day.tempMax}°</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
