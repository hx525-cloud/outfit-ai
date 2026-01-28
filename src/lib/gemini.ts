import type { AIRecognitionResult, Clothing, UserProfile, OutfitRecommendation } from '@/types'

const API_ENDPOINT = '/api/gemini'

interface GeminiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>
}

async function callGemini(messages: GeminiMessage[]): Promise<string> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// AI 识别衣物属性
export async function recognizeClothing(imageBlob: Blob): Promise<AIRecognitionResult> {
  const base64 = await blobToBase64(imageBlob)

  const messages: GeminiMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `请分析这张衣物图片，返回 JSON 格式的识别结果：
{
  "colorPrimary": "主色（如：黑色、白色、藏青色）",
  "colorSecondary": "辅色（可选）",
  "category": "分类（上装/下装/外套/内搭/鞋子/配饰/套装）",
  "type": "具体类型（如：T恤、牛仔裤、羽绒服）",
  "subType": "子类型（可选，如：短袖T恤）",
  "style": ["风格数组，如：休闲、运动"],
  "pattern": "花纹（纯色/条纹/格子/印花/迷彩）",
  "season": ["适用季节数组：春/夏/秋/冬"],
  "material": ["材质数组，如：棉、羊毛"],
  "thickness": "厚度（薄款/常规/加厚/特厚）",
  "warmthLevel": "保暖等级（1-5，1最薄5最暖）"
}
只返回 JSON，不要其他文字。`,
        },
        {
          type: 'image_url',
          image_url: { url: base64 },
        },
      ],
    },
  ]

  const result = await callGemini(messages)
  return JSON.parse(result.replace(/```json\n?|\n?```/g, ''))
}

// AI 穿搭推荐
export async function getOutfitRecommendations(
  clothes: Clothing[],
  userProfile: UserProfile,
  occasion: string,
  temperature: number,
  weather: string
): Promise<OutfitRecommendation[]> {
  const clothesSummary = clothes.map((c) => ({
    id: c.id,
    name: c.name || c.type,
    category: c.category,
    type: c.type,
    color: c.colorPrimary,
    warmthLevel: c.warmthLevel,
    style: c.style,
    layering: c.layering,
  }))

  const messages: GeminiMessage[] = [
    {
      role: 'user',
      content: `作为专业穿搭顾问，请根据以下信息推荐3套穿搭方案：

用户信息：
- 性别：${userProfile.gender}
- 身高：${userProfile.height}cm
- 体重：${userProfile.weight}kg
- 身材类型：${userProfile.bodyType || '标准'}
- 风格偏好：${userProfile.stylePreference?.join('、') || '无特别偏好'}

场合：${occasion}
当前温度：${temperature}°C
天气：${weather}

可选衣物：
${JSON.stringify(clothesSummary, null, 2)}

请返回 JSON 数组格式：
[
  {
    "id": "推荐1",
    "clothingIds": ["衣物id1", "衣物id2", ...],
    "reason": "推荐理由",
    "score": 95,
    "occasion": "${occasion}",
    "temperature": ${temperature}
  }
]
只返回 JSON，不要其他文字。`,
    },
  ]

  const result = await callGemini(messages)
  return JSON.parse(result.replace(/```json\n?|\n?```/g, ''))
}

// 虚拟试衣
export async function virtualTryOn(
  personImageBlob: Blob,
  clothingImageBlob: Blob
): Promise<string> {
  const personBase64 = await blobToBase64(personImageBlob)
  const clothingBase64 = await blobToBase64(clothingImageBlob)

  const messages: GeminiMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请将第二张图片中的衣物穿到第一张图片中的人物身上，生成一张虚拟试衣效果图。保持人物的姿势和背景不变，只替换衣物。',
        },
        {
          type: 'image_url',
          image_url: { url: personBase64 },
        },
        {
          type: 'image_url',
          image_url: { url: clothingBase64 },
        },
      ],
    },
  ]

  // 返回生成的图片 base64
  return await callGemini(messages)
}
