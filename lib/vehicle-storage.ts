export const STORAGE_VERSION = 1

export interface Vehicle {
  id: string
  name: string
  createdAt: string
  currency?: string // Display currency symbol only, no conversion
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
  entries: Record<string, MileageEntry[]> // vehicleId -> entries
}

export function migrateLocalStorage(): VehicleData {
  const legacyEntries = localStorage.getItem("phev-mileage-entries")
  const existingData = localStorage.getItem("phev-vehicle-data")

  if (existingData) {
    const data = JSON.parse(existingData) as VehicleData
    return data
  }

  if (legacyEntries) {
    const entries = JSON.parse(legacyEntries) as MileageEntry[]
    const defaultVehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: "My Vehicle",
      createdAt: new Date().toISOString(),
    }

    const vehicleData: VehicleData = {
      version: STORAGE_VERSION,
      vehicles: [defaultVehicle],
      currentVehicleId: defaultVehicle.id,
      entries: {
        [defaultVehicle.id]: entries,
      },
    }

    localStorage.setItem("phev-vehicle-data", JSON.stringify(vehicleData))
    localStorage.removeItem("phev-mileage-entries") // Clean up legacy storage
    return vehicleData
  }

  const newVehicle: Vehicle = {
    id: crypto.randomUUID(),
    name: "My Vehicle",
    createdAt: new Date().toISOString(),
  }

  const vehicleData: VehicleData = {
    version: STORAGE_VERSION,
    vehicles: [newVehicle],
    currentVehicleId: newVehicle.id,
    entries: {
      [newVehicle.id]: [],
    },
  }

  localStorage.setItem("phev-vehicle-data", JSON.stringify(vehicleData))
  return vehicleData
}

export function saveVehicleData(data: VehicleData) {
  localStorage.setItem("phev-vehicle-data", JSON.stringify(data))
}

export function loadVehicleData(): VehicleData {
  return migrateLocalStorage()
}

export function deleteVehicle(data: VehicleData, vehicleId: string): VehicleData | null {
  // Prevent deleting the last vehicle
  if (data.vehicles.length <= 1) {
    return null
  }

  // Remove the vehicle
  const updatedVehicles = data.vehicles.filter((v) => v.id !== vehicleId)

  // Remove entries for this vehicle
  const updatedEntries = { ...data.entries }
  delete updatedEntries[vehicleId]

  // If deleting current vehicle, switch to the first available vehicle
  const newCurrentVehicleId = data.currentVehicleId === vehicleId ? updatedVehicles[0].id : data.currentVehicleId

  return {
    ...data,
    vehicles: updatedVehicles,
    currentVehicleId: newCurrentVehicleId,
    entries: updatedEntries,
  }
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    KRW: "₩",
    SGD: "S$",
    HKD: "HK$",
    SEK: "kr",
    NOK: "kr",
    NZD: "NZ$",
    MXN: "MX$",
    ZAR: "R",
    BRL: "R$",
    TRY: "₺",
    RUB: "₽",
    PHP: "₱",
  }
  return symbols[currency] || currency
}

export function updateVehicleCurrency(data: VehicleData, vehicleId: string, currency: string): VehicleData {
  const updatedVehicles = data.vehicles.map((v) => (v.id === vehicleId ? { ...v, currency } : v))
  return {
    ...data,
    vehicles: updatedVehicles,
  }
}
