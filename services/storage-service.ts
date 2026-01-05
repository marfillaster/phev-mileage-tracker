import type { VehicleData, Vehicle, MileageEntry } from "@/lib/types"

const STORAGE_KEY = "phev-vehicle-data"
const LEGACY_KEY = "phev-mileage-entries"
const STORAGE_VERSION = 1

export interface StorageError extends Error {
  code: "PARSE_ERROR" | "QUOTA_EXCEEDED" | "NOT_FOUND" | "INVALID_DATA"
}

export class StorageService {
  /**
   * Load vehicle data from localStorage with migration support
   */
  static load(): VehicleData {
    try {
      // Try new format first
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing) {
        const data = JSON.parse(existing) as VehicleData
        return this.validate(data)
      }

      // Try legacy migration
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        return this.migrateLegacy(JSON.parse(legacy) as MileageEntry[])
      }

      // Initialize new data
      return this.initialize()
    } catch (error) {
      console.error("[StorageService] Load error:", error)
      return this.initialize()
    }
  }

  /**
   * Save vehicle data to localStorage with error handling
   */
  static save(data: VehicleData): boolean {
    try {
      this.validate(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        const storageError = new Error("Storage quota exceeded") as StorageError
        storageError.code = "QUOTA_EXCEEDED"
        throw storageError
      }
      throw error
    }
  }

  /**
   * Clear all vehicle data from localStorage
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  }

  /**
   * Validate vehicle data structure
   */
  private static validate(data: VehicleData): VehicleData {
    if (!data || typeof data !== "object") {
      throw this.createError("INVALID_DATA", "Data is not an object")
    }

    if (!Array.isArray(data.vehicles) || data.vehicles.length === 0) {
      throw this.createError("INVALID_DATA", "No vehicles found")
    }

    if (!data.currentVehicleId) {
      throw this.createError("INVALID_DATA", "No current vehicle ID")
    }

    if (!data.entries || typeof data.entries !== "object") {
      throw this.createError("INVALID_DATA", "Invalid entries structure")
    }

    return data
  }

  /**
   * Migrate legacy single-vehicle format to multi-vehicle
   */
  private static migrateLegacy(entries: MileageEntry[]): VehicleData {
    const defaultVehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: "My Vehicle",
      createdAt: new Date().toISOString(),
    }

    const data: VehicleData = {
      version: STORAGE_VERSION,
      vehicles: [defaultVehicle],
      currentVehicleId: defaultVehicle.id,
      entries: {
        [defaultVehicle.id]: entries,
      },
    }

    this.save(data)
    localStorage.removeItem(LEGACY_KEY)
    return data
  }

  /**
   * Initialize new empty vehicle data
   */
  private static initialize(): VehicleData {
    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: "My Vehicle",
      createdAt: new Date().toISOString(),
    }

    const data: VehicleData = {
      version: STORAGE_VERSION,
      vehicles: [vehicle],
      currentVehicleId: vehicle.id,
      entries: {
        [vehicle.id]: [],
      },
    }

    this.save(data)
    return data
  }

  /**
   * Create typed error
   */
  private static createError(code: StorageError["code"], message: string): StorageError {
    const error = new Error(message) as StorageError
    error.code = code
    return error
  }

  /**
   * Get storage usage statistics
   */
  static getStats(): { used: number; available: number; percentage: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || ""
      const used = new Blob([data]).size
      const available = 5 * 1024 * 1024 // Assume 5MB quota
      return {
        used,
        available,
        percentage: (used / available) * 100,
      }
    } catch {
      return { used: 0, available: 0, percentage: 0 }
    }
  }
}
