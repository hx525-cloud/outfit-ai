import type { WeatherData } from '@/types'

const CACHE_KEY = 'outfit-weather-cache'
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3小时缓存

// 获取缓存的天气数据
export function getCachedWeather(): WeatherData | null {
  if (typeof window === 'undefined') return null

  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null

  try {
    const data: WeatherData = JSON.parse(cached)
    const now = Date.now()

    // 检查是否过期（3小时）或跨天
    const cachedDate = new Date(data.cachedAt).toDateString()
    const todayDate = new Date().toDateString()

    if (now - data.cachedAt > CACHE_DURATION || cachedDate !== todayDate) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

// 保存天气数据到缓存
export function cacheWeather(data: WeatherData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

// 获取用户地理位置
export function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // 5分钟内的位置缓存
    })
  })
}

// 获取天气数据（优先使用缓存）
export async function getWeather(): Promise<WeatherData> {
  // 先检查缓存
  const cached = getCachedWeather()
  if (cached) {
    return cached
  }

  // 获取位置
  const position = await getUserLocation()
  const { latitude, longitude } = position.coords

  // 请求天气API
  const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取天气失败')
  }

  const data = await response.json()
  const weatherData: WeatherData = {
    ...data,
    cachedAt: Date.now(),
  }

  // 缓存数据
  cacheWeather(weatherData)

  return weatherData
}

// 根据温度获取穿衣建议等级
export function getClothingLevel(temp: number): string {
  if (temp >= 30) return '炎热'
  if (temp >= 25) return '温暖'
  if (temp >= 20) return '舒适'
  if (temp >= 15) return '微凉'
  if (temp >= 10) return '凉爽'
  if (temp >= 5) return '寒冷'
  return '严寒'
}

// 获取天气图标URL
export function getWeatherIconUrl(icon: string): string {
  return `https://a.hecdn.net/img/common/icon/202106d/${icon}.png`
}
