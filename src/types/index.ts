// 用户身材数据
export interface UserProfile {
  id: string
  gender: '男' | '女'
  height: number
  weight: number
  bust: number
  waist: number
  hips: number
  shoulder?: number
  bodyType?: '偏瘦' | '标准' | '偏胖'
  stylePreference?: string[]
  createdAt: Date
  updatedAt: Date
}

// 衣物分类
export type ClothingCategory = '上装' | '下装' | '外套' | '内搭' | '鞋子' | '配饰' | '套装'

// 厚度
export type Thickness = '薄款' | '常规' | '加厚' | '特厚'

// 保暖等级
export type WarmthLevel = 1 | 2 | 3 | 4 | 5

// 叠穿层次
export type Layering = '内搭' | '中层' | '外层' | '通用'

// 版型
export type FitType = '修身' | '合身' | '宽松' | '超宽松'

// 衣长
export type ClothingLength = '短款' | '常规' | '中长' | '长款'

// 衣物数据
export interface Clothing {
  id: string
  imageBlob: Blob
  thumbnailBlob: Blob
  name?: string
  brand?: string
  colorPrimary: string
  colorSecondary?: string
  colorTertiary?: string
  category: ClothingCategory
  type: string
  subType?: string
  material?: string[]
  thickness: Thickness
  warmthLevel: WarmthLevel
  windproof?: boolean
  waterproof?: boolean
  fleeceLinned?: boolean
  style: string[]
  pattern: string
  occasion: string[]
  season: string[]
  tempRangeMin?: number
  tempRangeMax?: number
  layering: Layering
  fitType?: FitType
  length?: ClothingLength
  favorite: boolean
  wearCount: number
  lastWorn?: Date
  purchaseDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// 穿搭历史
export interface OutfitHistory {
  id: string
  clothingIds: string[]
  occasion: string
  weather?: string
  temperature?: number
  rating?: number
  aiSuggestion?: string
  imageBlob?: Blob
  createdAt: Date
}

// AI 识别结果
export interface AIRecognitionResult {
  colorPrimary: string
  colorSecondary?: string
  category: ClothingCategory
  type: string
  subType?: string
  style: string[]
  pattern: string
  season: string[]
  material?: string[]
  thickness: Thickness
  warmthLevel: WarmthLevel
}

// 穿搭推荐
export interface OutfitRecommendation {
  id: string
  clothingIds: string[]
  reason: string
  score: number
  occasion: string
  temperature: number
}

// 天气数据
export interface WeatherCurrent {
  temp: number           // 当前温度
  feelsLike: number      // 体感温度
  text: string           // 天气描述（晴、多云等）
  icon: string           // 图标代码
  humidity: number       // 湿度百分比
  windDir: string        // 风向
  windScale: string      // 风力等级
}

export interface WeatherForecast {
  date: string           // 日期 YYYY-MM-DD
  tempMin: number        // 最低温度
  tempMax: number        // 最高温度
  textDay: string        // 白天天气
  textNight: string      // 夜间天气
  iconDay: string        // 白天图标
  iconNight: string      // 夜间图标
}

export interface WeatherData {
  location: string       // 城市名称
  current: WeatherCurrent
  forecast: WeatherForecast[]  // 未来3天预报
  cachedAt: number       // 缓存时间戳
}

// AI对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

// 每日穿搭推荐缓存
export interface DailyRecommendation {
  date: string           // YYYY-MM-DD
  recommendation: string // AI推荐内容
  clothingIds: string[]  // 推荐的衣物ID
  weather: WeatherCurrent
  cachedAt: number
}
