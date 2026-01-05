import type { MileageEntry } from "./types"

export interface MetricsResult {
  totalDistance: number
  totalHevDistance: number
  totalEvDistance: number
  totalFuelAmount: number
  totalFuelCost: number
  totalEnergy: number
  totalEnergyCost: number
  totalCost: number
  totalDays: number
  evPercentage: number
  hevPercentage: number
  avgDistancePerDay: number
  avgCostPerDay: number
  costPerKm: number
  evCostPerKm: number
  hevCostPerKm: number
  hevFuelAmount: number
  evEnergy: number
  hevFuelEfficiency: number
  combinedKmPerLiter: number
  evEquivalentKmPerLiter: number
  litersPer100km: number
  hevLitersPer100km: number
  evKwhPer100km: number
  evWhPerKm: number
  evEquivalentLitersPer100km: number
}

export interface TimeRangeFilter {
  type: "year" | "last6months"
  year?: number
}

/**
 * Filter entries by time range
 */
export function filterEntriesByTimeRange(entries: MileageEntry[], filter: TimeRangeFilter): MileageEntry[] {
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (filter.type === "year" && filter.year) {
    return sorted.filter((entry) => {
      const entryYear = new Date(entry.date).getFullYear()
      return entryYear === filter.year
    })
  }

  if (filter.type === "last6months") {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return sorted.filter((entry) => new Date(entry.date) >= sixMonthsAgo)
  }

  return sorted
}

/**
 * Find oldest entry with complete HEV and EV ODO data
 */
function findOldestCompleteDataIndex(entries: MileageEntry[]): number {
  let oldestIndex = -1
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].hevOdo && entries[i].evOdo) {
      oldestIndex = i
    }
  }
  return oldestIndex
}

/**
 * Truncate entries to only include complete data range
 */
function truncateToCompleteData(entries: MileageEntry[]): MileageEntry[] {
  const oldestIndex = findOldestCompleteDataIndex(entries)
  if (oldestIndex > 0) {
    return entries.slice(0, oldestIndex + 1)
  }
  return entries
}

/**
 * Calculate comprehensive metrics from mileage entries
 */
export function calculateMetrics(entries: MileageEntry[], filter?: TimeRangeFilter): MetricsResult | null {
  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return null
  }

  // Filter by time range if provided
  let filtered = entries
  if (filter) {
    filtered = filterEntriesByTimeRange(entries, filter)
  }

  if (filtered.length < 2) return null

  // Truncate to complete data range
  const truncated = truncateToCompleteData(filtered)
  if (truncated.length < 2) return null

  let totalDistance = 0
  let totalHevDistance = 0
  let totalEvDistance = 0
  let totalFuelAmount = 0
  let totalFuelCost = 0
  const totalEnergy = 0
  let totalEnergyCost = 0

  let hevFuelAmount = 0
  let evEnergy = 0

  // Calculate deltas between consecutive entries
  for (let i = truncated.length - 1; i > 0; i--) {
    const current = truncated[i - 1]
    const previous = truncated[i]

    if (current.hevOdo && current.evOdo && previous.hevOdo && previous.evOdo) {
      const distance = current.odo - previous.odo
      totalDistance += distance

      const hevDistance = current.hevOdo - previous.hevOdo
      totalHevDistance += hevDistance
      hevFuelAmount += current.fuelAmount

      const evDistance = current.evOdo - previous.evOdo
      totalEvDistance += evDistance

      const energy = current.pluginAmount - previous.pluginAmount
      evEnergy += energy

      totalFuelAmount += current.fuelAmount
      totalFuelCost += current.fuelCost

      const energyCost = energy * current.energyTariff
      totalEnergyCost += energyCost
    }
  }

  const firstDate = new Date(truncated[truncated.length - 1].date)
  const lastDate = new Date(truncated[0].date)
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))

  const totalCost = totalFuelCost + totalEnergyCost

  // Calculate percentages
  const evPercentage = totalDistance > 0 ? (totalEvDistance / totalDistance) * 100 : 0
  const hevPercentage = totalDistance > 0 ? (totalHevDistance / totalDistance) * 100 : 0

  // Calculate averages
  const avgDistancePerDay = totalDistance / totalDays
  const avgCostPerDay = totalCost / totalDays

  // Calculate costs per km
  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
  const evCostPerKm = totalEvDistance > 0 ? totalEnergyCost / totalEvDistance : 0
  const hevCostPerKm = totalHevDistance > 0 ? totalFuelCost / totalHevDistance : 0

  // Fuel efficiency calculations
  const hevFuelEfficiency = hevFuelAmount > 0 ? totalHevDistance / hevFuelAmount : 0
  const combinedKmPerLiter = totalFuelAmount > 0 ? totalDistance / totalFuelAmount : 0
  const litersPer100km = totalDistance > 0 ? (totalFuelAmount / totalDistance) * 100 : 0
  const hevLitersPer100km = totalHevDistance > 0 ? (hevFuelAmount / totalHevDistance) * 100 : 0

  // EV efficiency calculations
  const evKwhPer100km = totalEvDistance > 0 ? (evEnergy / totalEvDistance) * 100 : 0
  const evWhPerKm = totalEvDistance > 0 ? (evEnergy / totalEvDistance) * 1000 : 0

  // Gasoline equivalent (33.7 kWh per gallon, 3.785 L per gallon = 8.9 kWh per liter)
  const kwhPerLiter = 8.9
  const evEquivalentKmPerLiter = evEnergy > 0 ? (totalEvDistance / evEnergy) * kwhPerLiter : 0
  const evEquivalentLitersPer100km = totalEvDistance > 0 ? (evEnergy / totalEvDistance / kwhPerLiter) * 100 : 0

  return {
    totalDistance,
    totalHevDistance,
    totalEvDistance,
    totalFuelAmount,
    totalFuelCost,
    totalEnergy: evEnergy,
    totalEnergyCost,
    totalCost,
    totalDays,
    evPercentage,
    hevPercentage,
    avgDistancePerDay,
    avgCostPerDay,
    costPerKm,
    evCostPerKm,
    hevCostPerKm,
    hevFuelAmount,
    evEnergy,
    hevFuelEfficiency,
    combinedKmPerLiter,
    evEquivalentKmPerLiter,
    litersPer100km,
    hevLitersPer100km,
    evKwhPer100km,
    evWhPerKm,
    evEquivalentLitersPer100km,
  }
}

/**
 * Get available years from entries
 */
export function getAvailableYears(entries: MileageEntry[]): number[] {
  const years = new Set<number>()
  entries.forEach((entry) => {
    years.add(new Date(entry.date).getFullYear())
  })
  return Array.from(years).sort((a, b) => b - a)
}

/**
 * Get year with most entries
 */
export function getYearWithMostEntries(entries: MileageEntry[]): number | null {
  if (entries.length === 0) return null

  const yearCounts = new Map<number, number>()
  entries.forEach((entry) => {
    const year = new Date(entry.date).getFullYear()
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1)
  })

  let maxYear = null
  let maxCount = 0
  yearCounts.forEach((count, year) => {
    if (count > maxCount) {
      maxCount = count
      maxYear = year
    }
  })

  return maxYear
}
