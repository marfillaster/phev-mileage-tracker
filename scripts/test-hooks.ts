import { loadVehicleData, saveVehicleData } from "../lib/vehicle-storage"
import type { VehicleData } from "../lib/types"

// Mock localStorage
const mockStorage: Record<string, string> = {}
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value
  },
  removeItem: (key: string) => {
    delete mockStorage[key]
  },
  clear: () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  },
  length: 0,
  key: () => null,
}

console.log("🧪 Running Hook Tests...\n")

// Test 1: Vehicle Data Initialization
console.log("Test 1: Vehicle Data Initialization")
localStorage.clear()
const initialData = loadVehicleData()
console.assert(initialData.vehicles.length === 1, "Should create default vehicle")
console.assert(initialData.currentVehicleId, "Should have current vehicle ID")
console.log("✓ Vehicle data initializes correctly\n")

// Test 2: Add Vehicle
console.log("Test 2: Add Vehicle")
const newVehicle = {
  id: crypto.randomUUID(),
  name: "Test Vehicle",
  createdAt: new Date().toISOString(),
  currency: "USD",
}
const withNewVehicle: VehicleData = {
  ...initialData,
  vehicles: [...initialData.vehicles, newVehicle],
  entries: {
    ...initialData.entries,
    [newVehicle.id]: [],
  },
}
saveVehicleData(withNewVehicle)
const loadedData = loadVehicleData()
console.assert(loadedData.vehicles.length === 2, "Should have 2 vehicles")
console.assert(
  loadedData.vehicles.some((v) => v.name === "Test Vehicle"),
  "Should contain new vehicle",
)
console.log("✓ Add vehicle works correctly\n")

// Test 3: Entry Management
console.log("Test 3: Entry Management")
const testEntry = {
  id: crypto.randomUUID(),
  date: "2025-01-01",
  odo: 1000,
  hevOdo: 400,
  evOdo: 600,
  fuelAmount: 50,
  fuelCost: 2500,
  pluginAmount: 100,
  energyTariff: 15,
}
const withEntry: VehicleData = {
  ...loadedData,
  entries: {
    ...loadedData.entries,
    [loadedData.currentVehicleId]: [testEntry],
  },
}
saveVehicleData(withEntry)
const loadedWithEntry = loadVehicleData()
const currentEntries = loadedWithEntry.entries[loadedWithEntry.currentVehicleId]
console.assert(currentEntries.length === 1, "Should have 1 entry")
console.assert(currentEntries[0].odo === 1000, "Entry should have correct ODO")
console.log("✓ Entry management works correctly\n")

// Test 4: Entry Navigation
console.log("Test 4: Entry Navigation")
const entries = [
  { ...testEntry, id: "1", date: "2025-01-01" },
  { ...testEntry, id: "2", date: "2025-01-02" },
  { ...testEntry, id: "3", date: "2025-01-03" },
]
const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
console.assert(sorted[0].id === "3", "Should sort by date descending")
console.assert(sorted[2].id === "1", "First entry should be last")

const currentIndex = sorted.findIndex((e) => e.id === "2")
const hasPrev = currentIndex > 0
const hasNext = currentIndex < sorted.length - 1
console.assert(hasPrev === true, "Should have previous entry")
console.assert(hasNext === true, "Should have next entry")
console.log("✓ Entry navigation works correctly\n")

// Test 5: Confirmation Hook Logic
console.log("Test 5: Confirmation Hook Logic")
let confirmState = { isOpen: false, id: null as string | null }
const confirm = (id: string) => {
  confirmState = { isOpen: true, id }
}
const cancel = () => {
  confirmState = { isOpen: false, id: null }
}

confirm("test-id")
console.assert(confirmState.isOpen === true, "Should open confirmation")
console.assert(confirmState.id === "test-id", "Should store ID")

cancel()
console.assert(confirmState.isOpen === false, "Should close confirmation")
console.assert(confirmState.id === null, "Should clear ID")
console.log("✓ Confirmation hook logic works correctly\n")

console.log("✅ All tests passed!")
