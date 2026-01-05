// Phase 2 Utilities Test Suite
import type { MileageEntry } from "../lib/types"
import {
  getSortedEntries,
  getNavigationState,
  getPreviousEntry,
  getNextEntry,
  isFirstEntry,
  isLastEntry,
} from "../lib/navigation"
import {
  calculateMetrics,
  filterEntriesByTimeRange,
  getAvailableYears,
  getYearWithMostEntries,
} from "../lib/calculations"
import {
  formatDate,
  formatDateForInput,
  formatNumber,
  formatCurrency,
  formatDistance,
  formatFuelEfficiency,
  formatEnergyConsumption,
  formatWhPerDistance,
  formatDays,
  formatPercentage,
} from "../lib/formatters"

// Test data
const testEntries: MileageEntry[] = [
  {
    id: "1",
    date: "2024-09-15",
    odo: 0,
    hevOdo: 0,
    evOdo: 0,
    fuelAmount: 45.2,
    fuelCost: 2541.12,
    pluginAmount: 0,
    energyTariff: 13.5,
  },
  {
    id: "2",
    date: "2024-10-20",
    odo: 1350,
    hevOdo: 540,
    evOdo: 810,
    fuelAmount: 46.8,
    fuelCost: 2632.8,
    pluginAmount: 135,
    energyTariff: 14.0,
  },
  {
    id: "3",
    date: "2024-11-25",
    odo: 2780,
    hevOdo: 1095,
    evOdo: 1685,
    fuelAmount: 48.1,
    fuelCost: 2780.0,
    pluginAmount: 270,
    energyTariff: 14.5,
  },
  {
    id: "4",
    date: "2025-01-10",
    odo: 4200,
    hevOdo: 1680,
    evOdo: 2520,
    fuelAmount: 47.5,
    fuelCost: 2755.0,
    pluginAmount: 405,
    energyTariff: 15.0,
  },
]

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`)
    passedTests++
  } else {
    console.log(`❌ FAIL: ${message}`)
    failedTests++
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected)
  assert(passed, `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`)
}

console.log("\n=== Phase 2: Utility Modules Tests ===\n")

// Navigation Tests
console.log("--- Navigation Tests ---")

const sorted = getSortedEntries(testEntries)
assertEqual(sorted[0].id, "4", "getSortedEntries returns newest first")
assertEqual(sorted[sorted.length - 1].id, "1", "getSortedEntries returns oldest last")

const navState = getNavigationState(testEntries, "2")
assertEqual(navState.hasPrevious, true, "getNavigationState detects previous entry")
assertEqual(navState.hasNext, true, "getNavigationState detects next entry")
assertEqual(navState.currentIndex, 2, "getNavigationState finds correct index")
assertEqual(navState.totalCount, 4, "getNavigationState counts total entries")

const prev = getPreviousEntry(testEntries, "2")
assertEqual(prev?.id, "4", "getPreviousEntry returns newer entry")

const next = getNextEntry(testEntries, "2")
assertEqual(next?.id, "3", "getNextEntry returns older entry")

assert(isFirstEntry(testEntries, "1"), "isFirstEntry identifies oldest entry")
assert(!isFirstEntry(testEntries, "4"), "isFirstEntry rejects newest entry")

assert(isLastEntry(testEntries, "4"), "isLastEntry identifies newest entry")
assert(!isLastEntry(testEntries, "1"), "isLastEntry rejects oldest entry")

// Calculations Tests
console.log("\n--- Calculations Tests ---")

const metrics = calculateMetrics(testEntries)
assert(metrics !== null, "calculateMetrics returns result for valid data")

if (metrics) {
  assert(metrics.totalDistance > 0, "calculateMetrics computes total distance")
  assert(metrics.totalDays > 0, "calculateMetrics computes total days")
  assert(metrics.evPercentage > 0 && metrics.evPercentage <= 100, "calculateMetrics computes EV percentage")
  assert(metrics.hevPercentage > 0 && metrics.hevPercentage <= 100, "calculateMetrics computes HEV percentage")
  assert(Math.abs(metrics.evPercentage + metrics.hevPercentage - 100) < 0.1, "EV + HEV percentages sum to 100")
  assert(metrics.costPerKm > 0, "calculateMetrics computes cost per km")
  assert(metrics.combinedKmPerLiter > 0, "calculateMetrics computes fuel efficiency")
  assert(metrics.evKwhPer100km > 0, "calculateMetrics computes EV efficiency")
}

const filtered2024 = filterEntriesByTimeRange(testEntries, { type: "year", year: 2024 })
assertEqual(filtered2024.length, 3, "filterEntriesByTimeRange filters by year")

const filtered2025 = filterEntriesByTimeRange(testEntries, { type: "year", year: 2025 })
assertEqual(filtered2025.length, 1, "filterEntriesByTimeRange filters 2025")

const years = getAvailableYears(testEntries)
assert(years.includes(2024) && years.includes(2025), "getAvailableYears finds all years")
assertEqual(years[0], 2025, "getAvailableYears sorts descending")

const mostEntriesYear = getYearWithMostEntries(testEntries)
assertEqual(mostEntriesYear, 2024, "getYearWithMostEntries finds year with most data")

// Edge case: metrics with filter
const metrics2024 = calculateMetrics(testEntries, { type: "year", year: 2024 })
assert(metrics2024 !== null, "calculateMetrics works with year filter")

const metrics2025 = calculateMetrics(testEntries, { type: "year", year: 2025 })
assert(metrics2025 === null, "calculateMetrics returns null for insufficient filtered data")

// Formatters Tests
console.log("\n--- Formatters Tests ---")

const testDate = new Date("2024-11-25")
const formattedDate = formatDate(testDate)
assert(formattedDate.includes("Nov") && formattedDate.includes("25"), "formatDate formats date")

const inputDate = formatDateForInput(testDate)
assertEqual(inputDate, "2024-11-25", "formatDateForInput returns YYYY-MM-DD")

assertEqual(formatNumber(123.456, 2), "123.46", "formatNumber rounds to decimals")
assertEqual(formatNumber(123.456, 0), "123", "formatNumber handles 0 decimals")

const currency = formatCurrency(1234.56, "PHP")
assert(currency.includes("₱") && currency.includes("1234.56"), "formatCurrency formats PHP")

const currencyUSD = formatCurrency(1234.56, "USD")
assert(currencyUSD.includes("$"), "formatCurrency formats USD")

const distanceKm = formatDistance(100)
assertEqual(distanceKm, "100.0 km", "formatDistance formats kilometers")

const distanceMi = formatDistance(100, "miles")
assert(distanceMi.includes("mi") && distanceMi.includes("62"), "formatDistance converts to miles")

const fuelKm = formatFuelEfficiency(15)
assertEqual(fuelKm, "15.00 km/L", "formatFuelEfficiency formats km/L")

const fuelMi = formatFuelEfficiency(15, "miles")
assert(fuelMi.includes("MPG"), "formatFuelEfficiency converts to MPG")

const energyKm = formatEnergyConsumption(16.5)
assertEqual(energyKm, "16.50 kWh/100km", "formatEnergyConsumption formats kWh/100km")

const whKm = formatWhPerDistance(165)
assertEqual(whKm, "165 Wh/km", "formatWhPerDistance formats Wh/km")

assertEqual(formatDays(1), "1 day", "formatDays handles singular")
assertEqual(formatDays(5), "5 days", "formatDays handles plural")

assertEqual(formatPercentage(62.5), "62.5%", "formatPercentage formats percentage")

// Summary
console.log("\n=== Test Summary ===")
console.log(`✅ Passed: ${passedTests}`)
console.log(`❌ Failed: ${failedTests}`)
console.log(`Total: ${passedTests + failedTests}`)

if (failedTests === 0) {
  console.log("\n🎉 All Phase 2 tests passed!")
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed`)
}
