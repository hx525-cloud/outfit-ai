import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const baseUrl = process.env.GEMINI_BASE_URL
    const apiKey = process.env.GEMINI_API_KEY
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API 配置缺失' },
        { status: 500 }
      )
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `上游 API 错误: ${error}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Gemini API 错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
