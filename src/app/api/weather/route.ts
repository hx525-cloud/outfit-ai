import { NextRequest, NextResponse } from 'next/server'

const QWEATHER_KEY = process.env.QWEATHER_API_KEY
const QWEATHER_BASE = process.env.QWEATHER_BASE_URL || 'https://devapi.qweather.com'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: '缺少经纬度参数' }, { status: 400 })
  }

  if (!QWEATHER_KEY) {
    return NextResponse.json({ error: '未配置天气API密钥' }, { status: 500 })
  }

  try {
    const location = `${lon},${lat}`

    // 并行请求实时天气和3天预报
    const [nowRes, forecastRes, geoRes] = await Promise.all([
      fetch(`${QWEATHER_BASE}/v7/weather/now?location=${location}&key=${QWEATHER_KEY}`),
      fetch(`${QWEATHER_BASE}/v7/weather/3d?location=${location}&key=${QWEATHER_KEY}`),
      fetch(`${QWEATHER_BASE}/v7/geo/city?location=${location}&key=${QWEATHER_KEY}`),
    ])

    const [nowData, forecastData, geoData] = await Promise.all([
      nowRes.json(),
      forecastRes.json(),
      geoRes.json(),
    ])

    if (nowData.code !== '200' || forecastData.code !== '200') {
      return NextResponse.json({ error: '天气API请求失败' }, { status: 502 })
    }

    const cityName = geoData.location?.[0]?.name || '未知位置'

    return NextResponse.json({
      location: cityName,
      current: {
        temp: Number(nowData.now.temp),
        feelsLike: Number(nowData.now.feelsLike),
        text: nowData.now.text,
        icon: nowData.now.icon,
        humidity: Number(nowData.now.humidity),
        windDir: nowData.now.windDir,
        windScale: nowData.now.windScale,
      },
      forecast: forecastData.daily.map((day: Record<string, string>) => ({
        date: day.fxDate,
        tempMin: Number(day.tempMin),
        tempMax: Number(day.tempMax),
        textDay: day.textDay,
        textNight: day.textNight,
        iconDay: day.iconDay,
        iconNight: day.iconNight,
      })),
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json({ error: '天气服务暂时不可用' }, { status: 500 })
  }
}
