"use client"

import { useState, useEffect } from "react"
import type { VehicleData, Vehicle } from "@/lib/types"
import {
  loadVehicleData,
  saveVehicleData,
  deleteVehicle as deleteVehicleUtil,
  clearVehicleEntries as clearVehicleEntriesUtil,
  updateVehicleCurrency as updateVehicleCurrencyUtil,
} from "@/lib/vehicle-storage"

export function useVehicleData() {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const data = loadVehicleData()
    setVehicleData(data)
    setIsLoaded(true)
  }, [])

  const currentVehicle = vehicleData?.vehicles.find((v) => v.id === vehicleData.currentVehicleId)

  const selectVehicle = (vehicleId: string) => {
    if (!vehicleData) return
    const updatedData = {
      ...vehicleData,
      currentVehicleId: vehicleId,
    }
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
  }

  const addVehicle = (name: string, currency?: string) => {
    if (!vehicleData) return
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      currency,
    }
    const updatedData = {
      ...vehicleData,
      vehicles: [...vehicleData.vehicles, newVehicle],
      currentVehicleId: newVehicle.id,
      entries: {
        ...vehicleData.entries,
        [newVehicle.id]: [],
      },
    }
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
    return newVehicle.id
  }

  const renameVehicle = (vehicleId: string, newName: string) => {
    if (!vehicleData) return
    const updatedData = {
      ...vehicleData,
      vehicles: vehicleData.vehicles.map((v) => (v.id === vehicleId ? { ...v, name: newName } : v)),
    }
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
  }

  const deleteVehicle = (vehicleId: string) => {
    if (!vehicleData) return false
    const updatedData = deleteVehicleUtil(vehicleData, vehicleId)
    if (!updatedData) return false
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
    return true
  }

  const clearEntries = (vehicleId: string) => {
    if (!vehicleData) return
    const updatedData = clearVehicleEntriesUtil(vehicleData, vehicleId)
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
  }

  const updateCurrency = (vehicleId: string, currency: string) => {
    if (!vehicleData) return
    const updatedData = updateVehicleCurrencyUtil(vehicleData, vehicleId, currency)
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
  }

  return {
    vehicleData,
    currentVehicle,
    isLoaded,
    vehicles: vehicleData?.vehicles || [],
    selectVehicle,
    addVehicle,
    renameVehicle,
    deleteVehicle,
    clearEntries,
    updateCurrency,
  }
}
