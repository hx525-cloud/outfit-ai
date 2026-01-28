import { create } from 'zustand'
import type { Clothing, UserProfile, OutfitHistory } from '@/types'
import * as db from '@/lib/db'

interface AppState {
  // 状态
  clothes: Clothing[]
  userProfile: UserProfile | null
  outfitHistory: OutfitHistory[]
  isLoading: boolean

  // 操作
  loadData: () => Promise<void>
  addClothing: (clothing: Clothing) => Promise<void>
  updateClothing: (id: string, updates: Partial<Clothing>) => Promise<void>
  deleteClothing: (id: string) => Promise<void>
  saveUserProfile: (profile: UserProfile) => Promise<void>
  addOutfitHistory: (history: OutfitHistory) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  clothes: [],
  userProfile: null,
  outfitHistory: [],
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true })
    try {
      const [clothes, userProfile, outfitHistory] = await Promise.all([
        db.getAllClothes(),
        db.getUserProfile(),
        db.getOutfitHistory(),
      ])
      set({ clothes, userProfile: userProfile || null, outfitHistory })
    } finally {
      set({ isLoading: false })
    }
  },

  addClothing: async (clothing) => {
    await db.addClothing(clothing)
    set((state) => ({ clothes: [...state.clothes, clothing] }))
  },

  updateClothing: async (id, updates) => {
    await db.updateClothing(id, updates)
    set((state) => ({
      clothes: state.clothes.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }))
  },

  deleteClothing: async (id) => {
    await db.deleteClothing(id)
    set((state) => ({
      clothes: state.clothes.filter((c) => c.id !== id),
    }))
  },

  saveUserProfile: async (profile) => {
    await db.saveUserProfile(profile)
    set({ userProfile: profile })
  },

  addOutfitHistory: async (history) => {
    await db.addOutfitHistory(history)
    set((state) => ({
      outfitHistory: [history, ...state.outfitHistory],
    }))
  },
}))
