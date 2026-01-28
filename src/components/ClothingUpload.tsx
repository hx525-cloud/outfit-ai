'use client'

import { useState, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { recognizeClothing } from '@/lib/gemini'
import { generateId } from '@/lib/utils'
import imageCompression from 'browser-image-compression'
import type { Clothing, AIRecognitionResult } from '@/types'

interface ClothingUploadProps {
  onUpload: (clothing: Clothing) => void
}

export function ClothingUpload({ onUpload }: ClothingUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [recognitionResult, setRecognitionResult] = useState<AIRecognitionResult | null>(null)
  const [formData, setFormData] = useState<Partial<Clothing>>({})

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      // 压缩图片
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
      })
      const thumbnail = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 256,
      })

      setImageBlob(compressed)
      setThumbnailBlob(thumbnail)
      setPreviewUrl(URL.createObjectURL(compressed))

      // AI 识别
      toast.info('正在识别衣物...')
      const result = await recognizeClothing(compressed)
      setRecognitionResult(result)
      setFormData(result)
      toast.success(`识别完成！识别为: ${result.type}`)
    } catch (error) {
      toast.error(`识别失败: ${String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (!imageBlob || !thumbnailBlob || !formData.category) return

    const clothing: Clothing = {
      id: generateId(),
      imageBlob: imageBlob,
      thumbnailBlob: thumbnailBlob,
      colorPrimary: formData.colorPrimary || '未知',
      category: formData.category,
      type: formData.type || '未知',
      thickness: formData.thickness || '常规',
      warmthLevel: formData.warmthLevel || 3,
      style: formData.style || [],
      pattern: formData.pattern || '纯色',
      occasion: formData.occasion || [],
      season: formData.season || [],
      layering: formData.layering || '通用',
      favorite: false,
      wearCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onUpload(clothing)
    setIsOpen(false)
    resetForm()
    toast.success('添加成功！')
  }, [imageBlob, thumbnailBlob, formData, onUpload])

  const resetForm = () => {
    setImageBlob(null)
    setThumbnailBlob(null)
    setPreviewUrl('')
    setRecognitionResult(null)
    setFormData({})
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        添加衣物
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加新衣物</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 图片上传 */}
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">点击上传衣物图片</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </label>
            ) : (
              <div className="relative">
                <img src={previewUrl} alt="预览" className="w-full h-48 object-contain rounded-lg bg-gray-100" />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}

            {/* 识别结果表单 */}
            {recognitionResult && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>分类</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as Clothing['category'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['上装', '下装', '外套', '内搭', '鞋子', '配饰', '套装'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>类型</Label>
                    <Input value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>主色</Label>
                    <Input value={formData.colorPrimary || ''} onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })} />
                  </div>
                  <div>
                    <Label>保暖等级</Label>
                    <Select value={String(formData.warmthLevel)} onValueChange={(v) => setFormData({ ...formData, warmthLevel: Number(v) as Clothing['warmthLevel'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((l) => (
                          <SelectItem key={l} value={String(l)}>{l}级</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">确认添加</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
