import Dexie, { type Table } from 'dexie'
import type { Clothing, UserProfile, OutfitHistory, ChatMessage } from '@/types'

export class OutfitDatabase extends Dexie {
  clothes!: Table<Clothing>
  userProfile!: Table<UserProfile>
  outfitHistory!: Table<OutfitHistory>
  chatMessages!: Table<ChatMessage>

  constructor() {
    super('OutfitAI')
    this.version(2).stores({
      clothes: 'id, category, type, colorPrimary, warmthLevel, favorite, createdAt',
      userProfile: 'id',
      outfitHistory: 'id, occasion, createdAt',
      chatMessages: 'id, createdAt',
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

// 对话历史操作
export async function addChatMessage(message: ChatMessage): Promise<string> {
  // 保持最多10条记录
  const count = await db.table('chatMessages').count()
  if (count >= 10) {
    const oldest = await db.table('chatMessages').orderBy('createdAt').first()
    if (oldest) {
      await db.table('chatMessages').delete(oldest.id)
    }
  }
  return await db.table('chatMessages').add(message) as string
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  return await db.table('chatMessages').orderBy('createdAt').toArray()
}

export async function clearChatMessages(): Promise<void> {
  await db.table('chatMessages').clear()
}
