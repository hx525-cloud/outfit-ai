'use client'

import { useState, useEffect } from 'react'
import { Heart, Trash2, Edit } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Clothing } from '@/types'

interface ClothingCardProps {
  clothing: Clothing
  onToggleFavorite: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (clothing: Clothing) => void
}

export function ClothingCard({ clothing, onToggleFavorite, onDelete, onEdit }: ClothingCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('')

  useEffect(() => {
    const url = URL.createObjectURL(clothing.thumbnailBlob)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [clothing.thumbnailBlob])

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-square">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={clothing.name || clothing.type}
            className="w-full h-full object-cover"
          />
        )}
        {/* 悬浮操作按钮 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={() => onEdit(clothing)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={() => onToggleFavorite(clothing.id)}>
            <Heart className={cn('w-4 h-4', clothing.favorite && 'fill-red-500 text-red-500')} />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDelete(clothing.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {/* 收藏标记 */}
        {clothing.favorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="font-medium truncate">{clothing.name || clothing.type}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{clothing.category}</span>
          <span className="text-xs text-gray-500">保暖{clothing.warmthLevel}级</span>
        </div>
      </CardContent>
    </Card>
  )
}
