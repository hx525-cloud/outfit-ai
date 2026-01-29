import { NextRequest, NextResponse } from 'next/server'

// 试衣专用 API - 固定使用 gpt-4o-image 模型
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const baseUrl = process.env.GEMINI_BASE_URL
    const apiKey = process.env.GEMINI_API_KEY
    // 试衣功能固定使用 gpt-4o-image 模型
    const model = 'gpt-4o-image'

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API 配置缺失' },
        { status: 500 }
      )
    }

    // 构建完整的 API URL
    const apiUrl = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/chat/completions`

    const response = await fetch(apiUrl, {
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
    console.error('Try-on API 错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
