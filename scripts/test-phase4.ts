import type { MileageEntry } from "../lib/types"

// Mock localStorage for Node.js
class MockLocalStorage {
  private store: Map<string, string> = new Map()

  getItem(key: string): string | null {
    return this.store.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// Setup mocks
global.localStorage = new MockLocalStorage() as any
global.crypto = require("crypto").webcrypto as any

// Import after mocks are set up
const { StorageService } = require("../services/storage-service")
const { ImportExportService } = require("../services/import-export-service")

// Test utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function createTestEntry(overrides: Partial<MileageEntry> = {}): MileageEntry {
  return {
    id: crypto.randomUUID(),
    date: "2025-01-01",
    odo: 1000,
    hevOdo: 400,
    evOdo: 600,
    fuelAmount: 45,
    fuelCost: 2700,
    pluginAmount: 150,
    energyTariff: 14.5,
    ...overrides,
  }
}

// Test Suite
console.log("🧪 Phase 4 Service Layer Tests\n")

let passedTests = 0
let totalTests = 0

function test(name: string, fn: () => void | Promise<void>): void {
  totalTests++
  try {
    const result = fn()
    if (result instanceof Promise) {
      result
        .then(() => {
          passedTests++
          console.log(`✅ ${name}`)
        })
        .catch((error) => {
          console.log(`❌ ${name}`)
          console.log(`   Error: ${error.message}`)
        })
    } else {
      passedTests++
      console.log(`✅ ${name}`)
    }
  } catch (error: any) {
    console.log(`❌ ${name}`)
    console.log(`   Error: ${error.message}`)
  }
}

// StorageService Tests
console.log("📦 StorageService Tests\n")

test("StorageService.initialize creates valid data", () => {
  localStorage.clear()
  const data = StorageService.load()
  assert(data.vehicles.length === 1, "Should create one vehicle")
  assert(data.currentVehicleId === data.vehicles[0].id, "Current vehicle should match")
  assert(Array.isArray(data.entries[data.currentVehicleId]), "Should initialize entries array")
})

test("StorageService.save persists data", () => {
  const data = StorageService.load()
  data.vehicles[0].name = "Test Vehicle"
  const saved = StorageService.save(data)
  assert(saved === true, "Should return true on success")

  const loaded = StorageService.load()
  assert(loaded.vehicles[0].name === "Test Vehicle", "Should persist changes")
})

test("StorageService.validate rejects invalid data", () => {
  try {
    StorageService["validate"]({ invalid: true } as any)
    assert(false, "Should throw error")
  } catch (error: any) {
    assert(error.code === "INVALID_DATA", "Should throw INVALID_DATA error")
  }
})

test("StorageService.migrateLegacy converts old format", () => {
  localStorage.clear()
  const legacyEntries = [createTestEntry(), createTestEntry({ date: "2025-01-02", odo: 1100 })]
  localStorage.setItem("phev-mileage-entries", JSON.stringify(legacyEntries))

  const data = StorageService.load()
  assert(data.vehicles.length === 1, "Should create one vehicle from legacy")
  assert(data.entries[data.currentVehicleId].length === 2, "Should migrate all entries")
  assert(localStorage.getItem("phev-mileage-entries") === null, "Should remove legacy key")
})

test("StorageService.clear removes all data", () => {
  StorageService.clear()
  assert(localStorage.getItem("phev-vehicle-data") === null, "Should remove main key")
})

test("StorageService.getStats returns usage info", () => {
  const data = StorageService.load()
  StorageService.save(data)
  const stats = StorageService.getStats()
  assert(stats.used > 0, "Should report storage usage")
  assert(stats.available > 0, "Should report available space")
  assert(stats.percentage >= 0 && stats.percentage <= 100, "Should calculate percentage")
})

// ImportExportService Tests
console.log("\n📤 ImportExportService Tests\n")

test("ImportExportService.generateCSV creates valid CSV", () => {
  const entries = [
    createTestEntry({ date: "2025-01-01", odo: 1000 }),
    createTestEntry({ date: "2025-01-15", odo: 1350, fuelAmount: 48 }),
  ]

  const csv = ImportExportService["generateCSV"](entries, "₱")
  assert(csv.includes("Date"), "Should include headers")
  assert(csv.includes("2025-01-01"), "Should include dates")
  assert(csv.includes("1000"), "Should include ODO values")
})

test("ImportExportService.parseCSV imports basic CSV", () => {
  const csv = `Date,ODO (km),EV ODO (km),HEV ODO (km),Fuel Amount (L),Fuel Cost (₱),Plug-in (kWh),Tariff (₱/kWh)
2025-01-01,1000,600,400,45,2700,150,14.5
2025-01-15,1350,810,540,48,2880,180,14.5`

  const entries = ImportExportService["parseCSV"](csv)
  assert(entries.length === 2, "Should parse 2 entries")
  assert(entries[0].odo === 1000, "Should parse ODO correctly")
  assert(entries[1].fuelAmount === 48, "Should parse fuel amount correctly")
})

test("ImportExportService.validateEntry checks required fields", () => {
  const valid = createTestEntry()
  assert(ImportExportService["validateEntry"](valid), "Should accept valid entry")

  const invalid = { date: "2025-01-01" }
  assert(!ImportExportService["validateEntry"](invalid), "Should reject invalid entry")
})

test("ImportExportService.calculateMetrics computes correctly", () => {
  const prev = createTestEntry({ date: "2025-01-01", odo: 1000, pluginAmount: 150 })
  const current = createTestEntry({ date: "2025-01-15", odo: 1350, pluginAmount: 180 })

  const calc = ImportExportService["calculateMetrics"](current, prev)
  assert(calc.distance === 350, "Should calculate distance")
  assert(calc.energyUsed === 30, "Should calculate energy used")
  assert(calc.days === 14, "Should calculate days")
})

test("ImportExportService.calculateMetrics handles first entry", () => {
  const entry = createTestEntry()
  const calc = ImportExportService["calculateMetrics"](entry, undefined)
  assert(calc.distance === 0, "Should return 0 distance for first entry")
  assert(calc.energyUsed === 0, "Should return 0 energy for first entry")
})

test("ImportExportService handles division by zero", () => {
  const prev = createTestEntry({ fuelAmount: 0, pluginAmount: 100 })
  const current = createTestEntry({ fuelAmount: 0, pluginAmount: 100 })

  const calc = ImportExportService["calculateMetrics"](current, prev)
  assert(calc.kmPerLiter === 0, "Should handle zero fuel amount")
  assert(!isNaN(calc.totalCost), "Should not produce NaN")
})

// Integration Tests
console.log("\n🔗 Integration Tests\n")

test("Full cycle: save, load, export, import", () => {
  localStorage.clear()

  // Initialize
  const data = StorageService.load()
  const vehicleId = data.currentVehicleId

  // Add entries
  data.entries[vehicleId] = [
    createTestEntry({ date: "2025-01-01", odo: 1000 }),
    createTestEntry({ date: "2025-01-15", odo: 1350 }),
  ]
  StorageService.save(data)

  // Load and verify
  const loaded = StorageService.load()
  assert(loaded.entries[vehicleId].length === 2, "Should persist entries")

  // Export CSV
  const csv = ImportExportService["generateCSV"](loaded.entries[vehicleId], "₱")
  assert(csv.length > 100, "Should generate substantial CSV")

  // Parse CSV back
  const imported = ImportExportService["parseCSV"](csv)
  assert(imported.length === 2, "Should re-import entries")
})

test("Error handling: invalid JSON import", async () => {
  const invalidJSON = new File(["{ invalid json }"], "test.json", { type: "application/json" })
  const result = await ImportExportService.importJSON(invalidJSON)
  assert(result.success === false, "Should fail on invalid JSON")
  assert(result.error !== undefined, "Should provide error message")
})

test("Error handling: empty CSV import", async () => {
  const emptyCSV = new File([""], "test.csv", { type: "text/csv" })
  const result = await ImportExportService.importCSV(emptyCSV)
  assert(result.success === false, "Should fail on empty CSV")
})

// Performance Tests
console.log("\n⚡ Performance Tests\n")

test("StorageService handles large datasets", () => {
  const data = StorageService.load()
  const vehicleId = data.currentVehicleId

  // Generate 1000 entries
  data.entries[vehicleId] = Array.from({ length: 1000 }, (_, i) =>
    createTestEntry({
      date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
      odo: 1000 + i * 100,
    }),
  )

  const start = Date.now()
  StorageService.save(data)
  const saved = StorageService.load()
  const duration = Date.now() - start

  assert(saved.entries[vehicleId].length === 1000, "Should handle 1000 entries")
  assert(duration < 500, `Should complete in <500ms (took ${duration}ms)`)
})

test("ImportExportService generates CSV for large dataset", () => {
  const entries = Array.from({ length: 500 }, (_, i) =>
    createTestEntry({
      date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
      odo: 1000 + i * 100,
    }),
  )

  const start = Date.now()
  const csv = ImportExportService["generateCSV"](entries, "₱")
  const duration = Date.now() - start

  assert(csv.split("\n").length === 501, "Should generate 500 data rows + header")
  assert(duration < 1000, `Should complete in <1s (took ${duration}ms)`)
})

// Summary
setTimeout(() => {
  console.log(`\n${"=".repeat(50)}`)
  console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`)
  console.log(`${"=".repeat(50)}\n`)

  if (passedTests === totalTests) {
    console.log("✅ All Phase 4 tests passed!")
    console.log("\n📝 Phase 4 Complete:")
    console.log("  - StorageService: localStorage abstraction with validation")
    console.log("  - ImportExportService: CSV/JSON import/export with metrics")
    console.log("  - Error handling, migration, performance tested")
    console.log("\n🚀 Ready for Phase 5: Integration into components")
  } else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`)
    process.exit(1)
  }
}, 100)
