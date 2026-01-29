'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { getOutfitRecommendations } from '@/lib/gemini'
import { generateId } from '@/lib/utils'
import type { Clothing, OutfitRecommendation } from '@/types'

// 衣物缩略图组件
function ClothingThumbnail({ clothing }: { clothing: Clothing }) {
  const imageUrl = useMemo(() => {
    if (clothing.thumbnailBlob) {
      return URL.createObjectURL(clothing.thumbnailBlob)
    }
    return null
  }, [clothing.thumbnailBlob])

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  return (
    <div className="flex-shrink-0 w-20">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={clothing.name || clothing.type}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            {clothing.type}
          </div>
        )}
      </div>
      <p className="text-xs text-center mt-1 truncate">{clothing.name || clothing.type}</p>
    </div>
  )
}

const occasions = ['日常', '工作', '约会', '运动', '聚会', '正式场合']
const weathers = ['晴天', '多云', '阴天', '小雨', '大雨', '雪天', '大风']

export default function RecommendPage() {
  const { clothes, userProfile, loadData, addOutfitHistory } = useAppStore()
  const [occasion, setOccasion] = useState('日常')
  const [temperature, setTemperature] = useState(20)
  const [weather, setWeather] = useState('晴天')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleGetRecommendations = async () => {
    if (!userProfile) {
      toast.error('请先完善个人资料')
      return
    }
    if (clothes.length < 3) {
      toast.error('衣橱衣物太少，请先添加更多衣物')
      return
    }

    setIsLoading(true)
    try {
      const results = await getOutfitRecommendations(clothes, userProfile, occasion, temperature, weather)
      setRecommendations(results)
      toast.success('推荐生成成功！')
    } catch (error) {
      toast.error(`推荐失败: ${String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOutfit = (rec: OutfitRecommendation) => {
    addOutfitHistory({
      id: generateId(),
      clothingIds: rec.clothingIds,
      occasion: rec.occasion,
      weather,
      temperature,
      aiSuggestion: rec.reason,
      createdAt: new Date(),
    })
    toast.success('已保存到穿搭历史！')
  }

  const getClothingById = (id: string) => clothes.find((c) => c.id === id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">穿搭推荐</h1>

      {/* 条件输入 */}
      <Card>
        <CardHeader>
          <CardTitle>今天的情况</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>场合</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {occasions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>温度 (°C)</Label>
              <Input type="number" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
            </div>
            <div>
              <Label>天气</Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {weathers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGetRecommendations} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            获取 AI 推荐
          </Button>
        </CardContent>
      </Card>

      {/* 推荐结果 */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">为你推荐</h2>
          {recommendations.map((rec, index) => (
            <Card key={rec.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>方案 {index + 1}</span>
                  <span className="text-sm font-normal text-primary">{rec.score}分</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 衣物展示 */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {rec.clothingIds.map((id) => {
                    const clothing = getClothingById(id)
                    if (!clothing) return null
                    return <ClothingThumbnail key={id} clothing={clothing} />
                  })}
                </div>
                {/* 推荐理由 */}
                <p className="text-sm text-gray-600">{rec.reason}</p>
                <Button variant="outline" onClick={() => handleSaveOutfit(rec)} className="w-full">
                  保存这套搭配
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {recommendations.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          输入今天的情况，让 AI 为你推荐穿搭吧！
        </div>
      )}
    </div>
  )
}