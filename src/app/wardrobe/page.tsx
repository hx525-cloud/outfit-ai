'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClothingCard } from '@/components/ClothingCard'
import { ClothingUpload } from '@/components/ClothingUpload'
import { useAppStore } from '@/store'
import type { Clothing, ClothingCategory } from '@/types'

const categories: Array<ClothingCategory | '全部'> = ['全部', '上装', '下装', '外套', '内搭', '鞋子', '配饰']

export default function WardrobePage() {
  const { clothes, loadData, addClothing, updateClothing, deleteClothing } = useAppStore()
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | '全部'>('全部')

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredClothes = activeCategory === '全部'
    ? clothes
    : clothes.filter((c) => c.category === activeCategory)

  const handleToggleFavorite = (id: string) => {
    const clothing = clothes.find((c) => c.id === id)
    if (clothing) {
      updateClothing(id, { favorite: !clothing.favorite })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这件衣物吗？')) {
      deleteClothing(id)
    }
  }

  const handleEdit = (clothing: Clothing) => {
    // TODO: 打开编辑弹窗
    console.log('编辑', clothing)
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的衣橱</h1>
        <ClothingUpload onUpload={addClothing} />
      </div>

      {/* 分类筛选 */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ClothingCategory | '全部')}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 衣物网格 */}
      {filteredClothes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredClothes.map((clothing) => (
            <ClothingCard
              key={clothing.id}
              clothing={clothing}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {activeCategory === '全部' ? '衣橱还是空的，快来添加衣物吧！' : `暂无${activeCategory}类衣物`}
        </div>
      )}
    </div>
  )
}
