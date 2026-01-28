'use client'

import { useState, useEffect } from 'react'
import { Save, Download, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAppStore } from '@/store'
import { exportData, importData, downloadBackup } from '@/lib/backup'
import { generateId } from '@/lib/utils'
import type { UserProfile } from '@/types'

export default function ProfilePage() {
  const { userProfile, saveUserProfile, loadData } = useAppStore()
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile)
    }
  }, [userProfile])

  const handleSave = async () => {
    const profile: UserProfile = {
      id: userProfile?.id || generateId(),
      gender: formData.gender || '男',
      height: formData.height || 170,
      weight: formData.weight || 65,
      bust: formData.bust || 90,
      waist: formData.waist || 75,
      hips: formData.hips || 95,
      shoulder: formData.shoulder,
      bodyType: formData.bodyType,
      stylePreference: formData.stylePreference,
      createdAt: userProfile?.createdAt || new Date(),
      updatedAt: new Date(),
    }
    await saveUserProfile(profile)
    toast.success('保存成功！')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()
      const filename = `outfit-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadBackup(data, filename)
      toast.success(`导出成功！已保存为 ${filename}`)
    } catch (error) {
      toast.error(`导出失败: ${String(error)}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      await importData(text)
      await loadData()
      toast.success('导入成功！')
    } catch (error) {
      toast.error(`导入失败: ${String(error)}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">个人设置</h1>

      {/* 身材数据 */}
      <Card>
        <CardHeader>
          <CardTitle>身材数据</CardTitle>
          <CardDescription>完善身材数据，获得更精准的穿搭推荐</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>性别</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as UserProfile['gender'] })}>
                <SelectTrigger><SelectValue placeholder="选择性别" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>身材类型</Label>
              <Select value={formData.bodyType} onValueChange={(v) => setFormData({ ...formData, bodyType: v as UserProfile['bodyType'] })}>
                <SelectTrigger><SelectValue placeholder="选择身材" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="偏瘦">偏瘦</SelectItem>
                  <SelectItem value="标准">标准</SelectItem>
                  <SelectItem value="偏胖">偏胖</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>身高 (cm)</Label>
              <Input type="number" value={formData.height || ''} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
            </div>
            <div>
              <Label>体重 (kg)</Label>
              <Input type="number" value={formData.weight || ''} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>胸围 (cm)</Label>
              <Input type="number" value={formData.bust || ''} onChange={(e) => setFormData({ ...formData, bust: Number(e.target.value) })} />
            </div>
            <div>
              <Label>腰围 (cm)</Label>
              <Input type="number" value={formData.waist || ''} onChange={(e) => setFormData({ ...formData, waist: Number(e.target.value) })} />
            </div>
            <div>
              <Label>臀围 (cm)</Label>
              <Input type="number" value={formData.hips || ''} onChange={(e) => setFormData({ ...formData, hips: Number(e.target.value) })} />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </CardContent>
      </Card>

      {/* 数据备份 */}
      <Card>
        <CardHeader>
          <CardTitle>数据备份</CardTitle>
          <CardDescription>导出数据以防丢失，或从备份恢复</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              导出数据
            </Button>
            <label>
              <Button variant="outline" className="w-full" disabled={isImporting} asChild>
                <span>
                  {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  导入数据
                </span>
              </Button>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            建议定期导出备份，以防浏览器数据丢失
          </p>
        </CardContent>
      </Card>
    </div>
  )
}