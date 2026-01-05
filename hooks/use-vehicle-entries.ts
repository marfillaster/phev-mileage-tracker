"use client"

import { useState, useEffect } from "react"
import type { MileageEntry } from "@/lib/types"
import { saveVehicleData } from "@/lib/vehicle-storage"

interface UseVehicleEntriesProps {
  vehicleData: any
  setVehicleData: (data: any) => void
  currentVehicleId: string
}

export function useVehicleEntries({ vehicleData, setVehicleData, currentVehicleId }: UseVehicleEntriesProps) {
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null)

  useEffect(() => {
    if (vehicleData && currentVehicleId) {
      setEntries(vehicleData.entries[currentVehicleId] || [])
    }
  }, [vehicleData, currentVehicleId])

  const addEntry = (entry: Omit<MileageEntry, "id">) => {
    if (!vehicleData) return

    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
    }
    const updatedEntries = [...entries, newEntry]
    const updatedData = {
      ...vehicleData,
      entries: {
        ...vehicleData.entries,
        [currentVehicleId]: updatedEntries,
      },
    }
    setVehicleData(updatedData)
    setEntries(updatedEntries)
    saveVehicleData(updatedData)
    return newEntry.id
  }

  const updateEntry = (entryId: string, updates: Omit<MileageEntry, "id">) => {
    if (!vehicleData) return

    const updatedEntries = entries.map((e) => (e.id === entryId ? { ...updates, id: entryId } : e))
    const updatedData = {
      ...vehicleData,
      entries: {
        ...vehicleData.entries,
        [currentVehicleId]: updatedEntries,
      },
    }
    setVehicleData(updatedData)
    setEntries(updatedEntries)
    saveVehicleData(updatedData)
  }

  const deleteEntry = (entryId: string) => {
    if (!vehicleData) return

    const updatedEntries = entries.filter((e) => e.id !== entryId)
    const updatedData = {
      ...vehicleData,
      entries: {
        ...vehicleData.entries,
        [currentVehicleId]: updatedEntries,
      },
    }
    setVehicleData(updatedData)
    setEntries(updatedEntries)
    saveVehicleData(updatedData)
  }

  const getSortedEntries = () => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getNavigationState = (entryId: string) => {
    const sortedEntries = getSortedEntries()
    const currentIndex = sortedEntries.findIndex((e) => e.id === entryId)
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < sortedEntries.length - 1,
      previousEntry: currentIndex > 0 ? sortedEntries[currentIndex - 1] : null,
      nextEntry: currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null,
    }
  }

  const getLatestEntry = () => {
    if (entries.length === 0) return null
    const sorted = getSortedEntries()
    return sorted[0]
  }

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getSortedEntries,
    getNavigationState,
    getLatestEntry,
    editingEntry,
    setEditingEntry,
  }
}
