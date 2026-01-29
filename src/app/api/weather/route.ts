import { NextRequest, NextResponse } from 'next/server'
import { gunzipSync } from 'zlib'

const QWEATHER_KEY = process.env.QWEATHER_API_KEY
const QWEATHER_BASE = process.env.QWEATHER_BASE_URL || 'https://devapi.qweather.com'

// 解析可能是 gzip 压缩的响应
async function parseResponse(res: Response): Promise<unknown> {
  const buffer = await res.arrayBuffer()
  const uint8Array = new Uint8Array(buffer)

  // 检查是否是 gzip 压缩（魔数 0x1f 0x8b）
  if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
    const decompressed = gunzipSync(Buffer.from(uint8Array))
    return JSON.parse(decompressed.toString('utf-8'))
  }

  // 非压缩数据，直接解析
  const text = new TextDecoder().decode(uint8Array)
  return JSON.parse(text)
}

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
    const [nowRes, forecastRes] = await Promise.all([
      fetch(`${QWEATHER_BASE}/v7/weather/now?location=${location}&key=${QWEATHER_KEY}`),
      fetch(`${QWEATHER_BASE}/v7/weather/3d?location=${location}&key=${QWEATHER_KEY}`),
    ])

    // 解析响应（处理 gzip 压缩）
    const [nowData, forecastData] = await Promise.all([
      parseResponse(nowRes),
      parseResponse(forecastRes),
    ]) as [Record<string, unknown>, Record<string, unknown>]

    if (nowData.code !== '200' || forecastData.code !== '200') {
      console.error('Weather API failed:', { nowCode: nowData.code, forecastCode: forecastData.code })
      return NextResponse.json({ error: '天气API请求失败' }, { status: 502 })
    }

    const now = nowData.now as Record<string, string>
    const daily = forecastData.daily as Record<string, string>[]

    return NextResponse.json({
      location: '当前位置',
      current: {
        temp: Number(now.temp),
        feelsLike: Number(now.feelsLike),
        text: now.text,
        icon: now.icon,
        humidity: Number(now.humidity),
        windDir: now.windDir,
        windScale: now.windScale,
      },
      forecast: daily.map((day) => ({
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
