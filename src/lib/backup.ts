import { db } from './db'
import type { Clothing, UserProfile, OutfitHistory } from '@/types'

interface BackupData {
  version: string
  exportedAt: string
  userProfile: UserProfile | null
  clothes: Array<Omit<Clothing, 'imageBlob' | 'thumbnailBlob'> & {
    imageBase64: string
    thumbnailBase64: string
  }>
  outfitHistory: Array<Omit<OutfitHistory, 'imageBlob'> & {
    imageBase64?: string
  }>
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(parts[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

export async function exportData(): Promise<string> {
  const userProfile = await db.userProfile.toCollection().first() || null
  const clothes = await db.clothes.toArray()
  const outfitHistory = await db.outfitHistory.toArray()

  const clothesWithBase64 = await Promise.all(
    clothes.map(async (c) => {
      const { imageBlob, thumbnailBlob, ...rest } = c
      return {
        ...rest,
        imageBase64: await blobToBase64(imageBlob),
        thumbnailBase64: await blobToBase64(thumbnailBlob),
      }
    })
  )

  const historyWithBase64 = await Promise.all(
    outfitHistory.map(async (h) => {
      const { imageBlob, ...rest } = h
      return {
        ...rest,
        imageBase64: imageBlob ? await blobToBase64(imageBlob) : undefined,
      }
    })
  )

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userProfile,
    clothes: clothesWithBase64,
    outfitHistory: historyWithBase64,
  }

  return JSON.stringify(backup, null, 2)
}

export async function importData(jsonString: string): Promise<void> {
  const backup: BackupData = JSON.parse(jsonString)

  // 清空现有数据
  await db.clothes.clear()
  await db.userProfile.clear()
  await db.outfitHistory.clear()

  // 导入用户资料
  if (backup.userProfile) {
    await db.userProfile.add(backup.userProfile)
  }

  // 导入衣物
  for (const c of backup.clothes) {
    const { imageBase64, thumbnailBase64, ...rest } = c
    await db.clothes.add({
      ...rest,
      imageBlob: base64ToBlob(imageBase64),
      thumbnailBlob: base64ToBlob(thumbnailBase64),
    } as Clothing)
  }

  // 导入穿搭历史
  for (const h of backup.outfitHistory) {
    const { imageBase64, ...rest } = h
    await db.outfitHistory.add({
      ...rest,
      imageBlob: imageBase64 ? base64ToBlob(imageBase64) : undefined,
    } as OutfitHistory)
  }
}

export function downloadBackup(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}