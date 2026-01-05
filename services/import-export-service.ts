import type { MileageEntry } from "@/lib/types"

export interface ExportOptions {
  filename?: string
  format: "json" | "csv"
  currencySymbol?: string
}

export interface ImportResult {
  success: boolean
  entries?: MileageEntry[]
  error?: string
}

export class ImportExportService {
  /**
   * Export entries to JSON file
   */
  static exportJSON(entries: MileageEntry[], filename?: string): void {
    const name = filename || `phev-mileage-${this.getDateString()}.json`
    const content = JSON.stringify(entries, null, 2)
    this.downloadFile(content, name, "application/json")
  }

  /**
   * Export entries to CSV file with calculated metrics
   */
  static exportCSV(entries: MileageEntry[], currencySymbol = "₱", filename?: string): void {
    const name = filename || `phev-mileage-${this.getDateString()}.csv`
    const content = this.generateCSV(entries, currencySymbol)
    this.downloadFile(content, name, "text/csv;charset=utf-8;")
  }

  /**
   * Import entries from JSON file
   */
  static async importJSON(file: File): Promise<ImportResult> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        return {
          success: false,
          error: "Invalid format: Expected an array of entries",
        }
      }

      // Validate entries
      const entries = data as MileageEntry[]
      for (const entry of entries) {
        if (!this.validateEntry(entry)) {
          return {
            success: false,
            error: "Invalid entry format in imported data",
          }
        }
      }

      return { success: true, entries }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown import error",
      }
    }
  }

  /**
   * Import entries from CSV file
   */
  static async importCSV(file: File): Promise<ImportResult> {
    try {
      const text = await file.text()
      const entries = this.parseCSV(text)

      if (entries.length === 0) {
        return {
          success: false,
          error: "No valid entries found in CSV",
        }
      }

      return { success: true, entries }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "CSV parse error",
      }
    }
  }

  /**
   * Generate CSV content from entries with full metrics
   */
  private static generateCSV(entries: MileageEntry[], currencySymbol: string): string {
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const headers = [
      "Date",
      "ODO (km)",
      "EV ODO (km)",
      "HEV ODO (km)",
      "Distance (km)",
      "EV Distance (km)",
      "HEV Distance (km)",
      "Days Since",
      "Fuel Amount (L)",
      `Fuel Cost (${currencySymbol})`,
      `Cost/L (${currencySymbol})`,
      "Plug-in (kWh)",
      "Energy Used (kWh)",
      `Tariff (${currencySymbol}/kWh)`,
      `Energy Cost (${currencySymbol})`,
      `Total Cost (${currencySymbol})`,
      "km/L",
      "L/100km",
      "EV km/kWh",
      "EV kWh/100km",
      "HEV km/L",
    ]

    const rows = sorted.map((entry, i) => {
      const prev = sorted[i + 1]
      const calc = this.calculateMetrics(entry, prev)

      return [
        entry.date,
        entry.odo.toFixed(1),
        entry.evOdo?.toFixed(1) || "",
        entry.hevOdo?.toFixed(1) || "",
        calc.distance.toFixed(1),
        calc.evDistance.toFixed(1),
        calc.hevDistance.toFixed(1),
        calc.days.toString(),
        entry.fuelAmount.toFixed(2),
        entry.fuelCost.toFixed(2),
        calc.costPerLiter.toFixed(2),
        entry.pluginAmount.toFixed(2),
        calc.energyUsed.toFixed(2),
        entry.energyTariff.toFixed(2),
        calc.energyCost.toFixed(2),
        calc.totalCost.toFixed(2),
        calc.kmPerLiter.toFixed(2),
        calc.litersPer100km.toFixed(2),
        calc.evKmPerKwh.toFixed(2),
        calc.evKwhPer100km.toFixed(2),
        calc.hevKmPerLiter.toFixed(2),
      ]
    })

    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
  }

  /**
   * Parse CSV content to entries (basic import)
   */
  private static parseCSV(content: string): MileageEntry[] {
    const lines = content.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const entries: MileageEntry[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const entry: any = {}

      headers.forEach((header, index) => {
        const value = values[index]
        if (header.toLowerCase().includes("date")) entry.date = value
        else if (
          header.toLowerCase().includes("odo") &&
          !header.toLowerCase().includes("ev") &&
          !header.toLowerCase().includes("hev")
        ) {
          entry.odo = Number.parseFloat(value) || 0
        } else if (header.toLowerCase().includes("ev odo")) entry.evOdo = Number.parseFloat(value) || undefined
        else if (header.toLowerCase().includes("hev odo")) entry.hevOdo = Number.parseFloat(value) || undefined
        else if (header.toLowerCase().includes("fuel amount")) entry.fuelAmount = Number.parseFloat(value) || 0
        else if (header.toLowerCase().includes("fuel cost")) entry.fuelCost = Number.parseFloat(value) || 0
        else if (header.toLowerCase().includes("plug-in")) entry.pluginAmount = Number.parseFloat(value) || 0
        else if (header.toLowerCase().includes("tariff")) entry.energyTariff = Number.parseFloat(value) || 0
      })

      if (this.validateEntry(entry)) {
        entry.id = crypto.randomUUID()
        entries.push(entry as MileageEntry)
      }
    }

    return entries
  }

  /**
   * Calculate metrics between two entries
   */
  private static calculateMetrics(entry: MileageEntry, prev: MileageEntry | undefined) {
    if (!prev) {
      return {
        distance: 0,
        evDistance: 0,
        hevDistance: 0,
        days: 0,
        costPerLiter: entry.fuelAmount > 0 ? entry.fuelCost / entry.fuelAmount : 0,
        energyUsed: 0,
        energyCost: 0,
        totalCost: entry.fuelCost,
        kmPerLiter: 0,
        litersPer100km: 0,
        evKmPerKwh: 0,
        evKwhPer100km: 0,
        hevKmPerLiter: 0,
      }
    }

    const distance = entry.odo - prev.odo
    const evDistance = (entry.evOdo || 0) - (prev.evOdo || 0)
    const hevDistance = (entry.hevOdo || 0) - (prev.hevOdo || 0)
    const energyUsed = entry.pluginAmount - prev.pluginAmount
    const energyCost = energyUsed * entry.energyTariff
    const totalCost = entry.fuelCost + energyCost
    const days = Math.round((new Date(entry.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24))

    const costPerLiter = entry.fuelAmount > 0 ? entry.fuelCost / entry.fuelAmount : 0
    const equivalentLiters = entry.fuelAmount + (costPerLiter > 0 ? energyCost / costPerLiter : 0)
    const kmPerLiter = equivalentLiters > 0 ? distance / equivalentLiters : 0
    const litersPer100km = kmPerLiter > 0 ? 100 / kmPerLiter : 0

    const evKmPerKwh = energyUsed > 0 ? evDistance / energyUsed : 0
    const evKwhPer100km = evDistance > 0 ? (energyUsed * 100) / evDistance : 0
    const hevKmPerLiter = entry.fuelAmount > 0 ? hevDistance / entry.fuelAmount : 0

    return {
      distance,
      evDistance,
      hevDistance,
      days,
      costPerLiter,
      energyUsed,
      energyCost,
      totalCost,
      kmPerLiter,
      litersPer100km,
      evKmPerKwh,
      evKwhPer100km,
      hevKmPerLiter,
    }
  }

  /**
   * Validate entry has required fields
   */
  private static validateEntry(entry: any): boolean {
    return (
      entry &&
      typeof entry === "object" &&
      typeof entry.date === "string" &&
      typeof entry.odo === "number" &&
      typeof entry.fuelAmount === "number" &&
      typeof entry.fuelCost === "number" &&
      typeof entry.pluginAmount === "number" &&
      typeof entry.energyTariff === "number"
    )
  }

  /**
   * Download file helper
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Get current date string for filenames
   */
  private static getDateString(): string {
    return new Date().toISOString().split("T")[0]
  }
}
