import { create } from 'zustand';

export interface AIResult {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  confidence: number;
  priority_reason: string;
  category: string;
  sentiment: string;
  department: string;
  expected_days: string;
  tips: string[];
}

interface AIStore {
  cache: Record<string, AIResult>;
  addCacheContext: (key: string, data: AIResult) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  cache: {},
  addCacheContext: (key, data) => 
    set((state) => ({ cache: { ...state.cache, [key]: data } }))
}));
