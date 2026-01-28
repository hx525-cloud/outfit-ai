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