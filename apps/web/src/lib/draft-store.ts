import { get, set, del } from "idb-keyval";

const DRAFT_KEY = "honeychain_harvest_draft_v1";
const memoryFallback = new Map<string, any>();

export async function saveHarvestDraft(data: any): Promise<void> {
  memoryFallback.set(DRAFT_KEY, data);
  if (typeof window !== "undefined" && "indexedDB" in window) {
    try {
      await set(DRAFT_KEY, data);
    } catch (e) {
      // indexedDB not accessible, memoryFallback retained
    }
  }
}

export async function loadHarvestDraft(): Promise<any> {
  if (typeof window !== "undefined" && "indexedDB" in window) {
    try {
      const val = await get(DRAFT_KEY);
      if (val) return val;
    } catch (e) {
      // fallback to memory
    }
  }
  return memoryFallback.get(DRAFT_KEY) || null;
}

export async function clearHarvestDraft(): Promise<void> {
  memoryFallback.delete(DRAFT_KEY);
  if (typeof window !== "undefined" && "indexedDB" in window) {
    try {
      await del(DRAFT_KEY);
    } catch (e) {}
  }
}
