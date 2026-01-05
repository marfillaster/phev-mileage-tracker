import type { MileageEntry } from "./types"

export interface NavigationState {
  hasPrevious: boolean
  hasNext: boolean
  currentIndex: number
  totalCount: number
}

/**
 * Get sorted entries (newest first)
 */
export function getSortedEntries(entries: MileageEntry[]): MileageEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get navigation state for current entry
 */
export function getNavigationState(entries: MileageEntry[], currentEntryId: string | null): NavigationState {
  if (!currentEntryId || entries.length === 0) {
    return { hasPrevious: false, hasNext: false, currentIndex: -1, totalCount: entries.length }
  }

  const sorted = getSortedEntries(entries)
  const currentIndex = sorted.findIndex((e) => e.id === currentEntryId)

  if (currentIndex === -1) {
    return { hasPrevious: false, hasNext: false, currentIndex: -1, totalCount: sorted.length }
  }

  return {
    hasPrevious: currentIndex > 0,
    hasNext: currentIndex < sorted.length - 1,
    currentIndex,
    totalCount: sorted.length,
  }
}

/**
 * Get previous entry in sorted list
 */
export function getPreviousEntry(entries: MileageEntry[], currentEntryId: string): MileageEntry | null {
  const sorted = getSortedEntries(entries)
  const currentIndex = sorted.findIndex((e) => e.id === currentEntryId)

  if (currentIndex <= 0) return null
  return sorted[currentIndex - 1]
}

/**
 * Get next entry in sorted list
 */
export function getNextEntry(entries: MileageEntry[], currentEntryId: string): MileageEntry | null {
  const sorted = getSortedEntries(entries)
  const currentIndex = sorted.findIndex((e) => e.id === currentEntryId)

  if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null
  return sorted[currentIndex + 1]
}

/**
 * Check if entry is the first (oldest) entry
 */
export function isFirstEntry(entries: MileageEntry[], entryId: string): boolean {
  if (entries.length === 0) return false
  const sorted = getSortedEntries(entries)
  return sorted[sorted.length - 1]?.id === entryId
}

/**
 * Check if entry is the last (newest) entry
 */
export function isLastEntry(entries: MileageEntry[], entryId: string): boolean {
  if (entries.length === 0) return false
  const sorted = getSortedEntries(entries)
  return sorted[0]?.id === entryId
}
