import Dexie, { type Table } from 'dexie'
import type { Clothing, UserProfile, OutfitHistory } from '@/types'

export class OutfitDatabase extends Dexie {
  clothes!: Table<Clothing>
  userProfile!: Table<UserProfile>
  outfitHistory!: Table<OutfitHistory>

  constructor() {
    super('OutfitAI')
    this.version(1).stores({
      clothes: 'id, category, type, colorPrimary, warmthLevel, favorite, createdAt',
      userProfile: 'id',
      outfitHistory: 'id, occasion, createdAt',
    })
  }
}

export const db = new OutfitDatabase()

// 衣物操作
export async function addClothing(clothing: Clothing): Promise<string> {
  return await db.clothes.add(clothing)
}

export async function updateClothing(id: string, updates: Partial<Clothing>): Promise<number> {
  return await db.clothes.update(id, { ...updates, updatedAt: new Date() })
}

export async function deleteClothing(id: string): Promise<void> {
  await db.clothes.delete(id)
}

export async function getClothing(id: string): Promise<Clothing | undefined> {
  return await db.clothes.get(id)
}

export async function getAllClothes(): Promise<Clothing[]> {
  return await db.clothes.toArray()
}

export async function getClothesByCategory(category: string): Promise<Clothing[]> {
  return await db.clothes.where('category').equals(category).toArray()
}

// 用户资料操作
export async function getUserProfile(): Promise<UserProfile | undefined> {
  return await db.userProfile.toCollection().first()
}

export async function saveUserProfile(profile: UserProfile): Promise<string> {
  const existing = await getUserProfile()
  if (existing) {
    await db.userProfile.update(existing.id, { ...profile, updatedAt: new Date() })
    return existing.id
  }
  return await db.userProfile.add(profile)
}

// 穿搭历史操作
export async function addOutfitHistory(history: OutfitHistory): Promise<string> {
  return await db.outfitHistory.add(history)
}

export async function getOutfitHistory(limit = 20): Promise<OutfitHistory[]> {
  return await db.outfitHistory.orderBy('createdAt').reverse().limit(limit).toArray()
}
