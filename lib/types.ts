export const STORAGE_VERSION = 1

export interface Vehicle {
  id: string
  name: string
  createdAt: string
  currency?: string
}

export interface MileageEntry {
  id: string
  date: string
  hevOdo?: number
  evOdo?: number
  odo: number
  fuelAmount: number
  fuelCost: number
  pluginAmount: number
  energyTariff: number
}

export interface VehicleData {
  version: number
  vehicles: Vehicle[]
  currentVehicleId: string
  entries: Record<string, MileageEntry[]>
}

export type TimeRange = "year" | "6months"
export type EfficiencyUnit = "kmPer" | "per100"
export type DistanceView = "total" | "perDay"
export type CostView = "total" | "perKm" | "perDay"
