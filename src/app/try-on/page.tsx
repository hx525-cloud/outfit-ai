'use client'

import { useState, useEffect } from 'react'
import { Camera, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { virtualTryOn } from '@/lib/gemini'

export default function TryOnPage() {
  const { clothes, loadData } = useAppStore()
  const [personImage, setPersonImage] = useState<Blob | null>(null)
  const [personPreview, setPersonPreview] = useState('')
  const [selectedClothing, setSelectedClothing] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePersonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPersonImage(file)
      setPersonPreview(URL.createObjectURL(file))
    }
  }

  const handleTryOn = async () => {
    if (!personImage || !selectedClothing) {
      toast.error('请先上传人物照片并选择衣物')
      return
    }

    const clothing = clothes.find((c) => c.id === selectedClothing)
    if (!clothing) return

    setIsLoading(true)
    try {
      const result = await virtualTryOn(personImage, clothing.imageBlob)
      setResultImage(result)
      toast.success('试衣效果生成成功！')
    } catch (error) {
      toast.error(`生成失败: ${String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return
    const a = document.createElement('a')
    a.href = resultImage
    a.download = `try-on-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">虚拟试衣</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧：上传人物照片 */}
        <Card>
          <CardHeader>
            <CardTitle>1. 上传人物照片</CardTitle>
          </CardHeader>
          <CardContent>
            {!personPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">点击上传全身照</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePersonUpload} />
              </label>
            ) : (
              <div className="relative">
                <img src={personPreview} alt="人物照片" className="w-full h-64 object-contain rounded-lg bg-gray-100" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => { setPersonImage(null); setPersonPreview('') }}
                >
                  重新上传
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：选择衣物 */}
        <Card>
          <CardHeader>
            <CardTitle>2. 选择要试穿的衣物</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {clothes.filter((c) => ['上装', '下装', '外套'].includes(c.category)).map((clothing) => (
                <div
                  key={clothing.id}
                  onClick={() => setSelectedClothing(clothing.id)}
                  className={`aspect-square rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-center text-xs text-center p-1 ${
                    selectedClothing === clothing.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {clothing.type}
                </div>
              ))}
            </div>
            {clothes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                衣橱还没有衣物，请先添加
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 生成按钮 */}
      <Button onClick={handleTryOn} disabled={isLoading || !personImage || !selectedClothing} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
        生成试衣效果
      </Button>

      {/* 结果展示 */}
      {resultImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              试衣效果
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img src={resultImage} alt="试衣效果" className="w-full rounded-lg" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
