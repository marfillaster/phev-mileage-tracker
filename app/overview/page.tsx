"use client"

import { useState, useEffect } from "react"
import type { MileageEntry } from "@/lib/vehicle-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import {
  Calendar,
  Fuel,
  Zap,
  DollarSign,
  Gauge,
  TrendingUp,
  Info,
  Moon,
  Sun,
  HelpCircle,
  Download,
  Upload,
  FileText,
  List,
} from "lucide-react"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AppToolbar } from "@/components/app-toolbar"
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet"
import {
  loadVehicleData,
  saveVehicleData,
  deleteVehicle,
  clearVehicleEntries, // Imported for clearing entries
  type VehicleData,
  getCurrencySymbol, // Imported for currency display
  updateVehicleCurrency, // Imported for currency update
} from "@/lib/vehicle-storage"
import { useTheme } from "@/components/theme-provider"
import { handleExport as exportJSON, handleExportCSV as exportCSV } from "@/lib/export-import"
import { generateCSV } from "@/components/mileage-table"
import { useRef } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TimeRange = "year" | "sixMonths"

export default function Overview() {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string>("PHP")
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("year")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [efficiencyUnit, setEfficiencyUnit] = useState<"kmPer" | "per100">("kmPer")
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [distanceView, setDistanceView] = useState<"total" | "perDay">("total")
  const [costView, setCostView] = useState<"total" | "perKm" | "perDay">("total")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<string | null>(null)
  const [clearEntriesConfirm, setClearEntriesConfirm] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const data = loadVehicleData()
    
    if (data) {
      setVehicleData(data)
      const currentVehicle = data.vehicles.find((v) => v.id === data.currentVehicleId)
      if (currentVehicle) {

        setEntries(data.entries[currentVehicle.id])
        if (data.entries[currentVehicle.id] && data.entries[currentVehicle.id].length > 0) {
          const sorted = [...data.entries[currentVehicle.id]].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          const mostRecentYear = new Date(sorted[0].date).getFullYear()
          setSelectedYear(mostRecentYear)
        }
        if (currentVehicle?.currency) {
          setSelectedCurrency(currentVehicle.currency)
        }
      }
    }
    setIsLoading(false)
  }, [])

  // ADDED: useEffect to sync selectedYear when entries change
  useEffect(() => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      setSelectedYear(new Date().getFullYear())
      return
    }

    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const mostRecentYear = new Date(sorted[0].date).getFullYear()

    // Check if the most recent year has enough entries for metrics calculation
    const entriesInMostRecentYear = entries.filter((e) => new Date(e.date).getFullYear() === mostRecentYear)

    // If most recent year has at least 2 entries, use it; otherwise find a year with enough data
    if (entriesInMostRecentYear.length >= 2) {
      setSelectedYear(mostRecentYear)
    } else {
      // Find the year with the most entries
      const yearCounts = new Map<number, number>()
      entries.forEach((entry) => {
        const year = new Date(entry.date).getFullYear()
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1)
      })

      let bestYear = mostRecentYear
      let maxCount = 0
      yearCounts.forEach((count, year) => {
        if (count > maxCount) {
          maxCount = count
          bestYear = year
        }
      })

      setSelectedYear(bestYear)
    }
  }, [entries])

  useEffect(() => {
    if (vehicleData) {
      const currentVehicle = vehicleData.vehicles.find((v) => v.id === vehicleData.currentVehicleId)
      if (currentVehicle?.currency && currentVehicle.currency !== selectedCurrency) {
        setSelectedCurrency(currentVehicle.currency)
      }
    }
  }, [vehicleData, selectedCurrency])

  const handleSelectVehicle = (vehicleId: string) => {
    if (!vehicleData) return
    const updatedData = {
      ...vehicleData,
      currentVehicleId: vehicleId,
    }
    setVehicleData(updatedData)
    const selectedVehicle = updatedData.vehicles.find((v) => v.id === vehicleId)
    if (selectedVehicle) {
      setEntries(selectedVehicle.entries)
      // Update currency when vehicle is selected
      if (selectedVehicle?.currency) {
        setSelectedCurrency(selectedVehicle.currency)
      }
      // Set selectedYear to the most recent entry's year for the selected vehicle
      if (selectedVehicle.entries.length > 0) {
        const sorted = [...selectedVehicle.entries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        const mostRecentYear = new Date(sorted[0].date).getFullYear()
        setSelectedYear(mostRecentYear)
      } else {
        setSelectedYear(new Date().getFullYear())
      }
    }
    saveVehicleData(updatedData)
  }

  const handleAddVehicle = (name: string) => {
    if (!vehicleData) return
    const newVehicle = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      entries: [], // Initialize with empty entries array
    }
    const updatedData = {
      ...vehicleData,
      vehicles: [...vehicleData.vehicles, newVehicle],
      currentVehicleId: newVehicle.id,
    }
    setVehicleData(updatedData)
    setEntries([])
    setSelectedYear(new Date().getFullYear()) // Reset year for new vehicle
    saveVehicleData(updatedData)
  }

  const handleRenameVehicle = (vehicleId: string, newName: string) => {
    if (!vehicleData) return
    const updatedData = {
      ...vehicleData,
      vehicles: vehicleData.vehicles.map((v) => (v.id === vehicleId ? { ...v, name: newName } : v)),
    }
    setVehicleData(updatedData)
    saveVehicleData(updatedData)
  }

  const handleDeleteVehicle = () => {
    if (!vehicleData || !deleteVehicleConfirm) return

    const updatedData = deleteVehicle(vehicleData, deleteVehicleConfirm)
    if (!updatedData) {
      alert("Cannot delete the last vehicle")
      setDeleteVehicleConfirm(null)
      return
    }

    setVehicleData(updatedData)
    // Adjusted to use the correct entry loading logic for the new current vehicle
    const currentVehicle = updatedData.vehicles.find((v) => v.id === updatedData.currentVehicleId)
    if (currentVehicle) {
      setEntries(currentVehicle.entries)
      // Update currency when vehicle is deleted
      if (currentVehicle?.currency) {
        setSelectedCurrency(currentVehicle.currency)
      } else {
        // Fallback to default or a reasonable default if no currency is set
        setSelectedCurrency("PHP")
      }
      // Set selectedYear to the most recent entry's year for the new current vehicle
      if (currentVehicle.entries.length > 0) {
        const sorted = [...currentVehicle.entries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        const mostRecentYear = new Date(sorted[0].date).getFullYear()
        setSelectedYear(mostRecentYear)
      } else {
        setSelectedYear(new Date().getFullYear())
      }
    } else {
      // If no vehicles are left, clear entries and reset year
      setEntries([])
      setSelectedYear(new Date().getFullYear())
    }
    saveVehicleData(updatedData)
    setDeleteVehicleConfirm(null)
  }

  const handleClearEntries = () => {
    if (!vehicleData || !clearEntriesConfirm) return

    const updatedData = clearVehicleEntries(vehicleData, clearEntriesConfirm)
    setVehicleData(updatedData)
    setEntries([]) // Clear local entries state
    setSelectedYear(new Date().getFullYear()) // Reset year
    saveVehicleData(updatedData)
    setClearEntriesConfirm(null)
  }

  const handleCurrencyChange = (currency: string) => {
    if (!vehicleData) return
    const updated = updateVehicleCurrency(vehicleData, vehicleData.currentVehicleId, currency)
    setVehicleData(updated)
    saveVehicleData(updated)
    setSelectedCurrency(currency)
  }

  const getAvailableYears = () => {
    if (entries.length === 0) return []

    const years = new Set<number>()
    entries.forEach((entry) => {
      years.add(new Date(entry.date).getFullYear())
    })

    return Array.from(years).sort((a, b) => b - a)
  }

  const availableYears = getAvailableYears()

  const calculateMetrics = (entries: MileageEntry[]) => {
    if (!entries || !Array.isArray(entries)) {
      console.log("[v0] calculateMetrics: entries is undefined or not an array")
      return null
    }

    console.log("[v0] calculateMetrics called with entries:", entries.length)

    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const filtered =
      timeRange === "year"
        ? sorted.filter((entry) => {
            const entryYear = new Date(entry.date).getFullYear()
            return entryYear === selectedYear
          })
        : sorted.filter((entry) => {
            const entryDate = new Date(entry.date)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            return entryDate >= sixMonthsAgo
          })

    console.log("[v0] After time range filter:", filtered.length)

    if (filtered.length < 2) return null

    let truncatedEntries = [...filtered]

    let oldestCompleteDataIndex = -1
    for (let i = truncatedEntries.length - 1; i >= 0; i--) {
      if (truncatedEntries[i].hevOdo && truncatedEntries[i].evOdo) {
        oldestCompleteDataIndex = i
      }
    }

    console.log("[v0] Oldest complete data index:", oldestCompleteDataIndex)

    if (oldestCompleteDataIndex > 0) {
      truncatedEntries = truncatedEntries.slice(0, oldestCompleteDataIndex + 1)
    }

    console.log("[v0] After truncation:", truncatedEntries.length)

    if (truncatedEntries.length < 2) return null

    let totalDistance = 0
    let totalHevDistance = 0
    let totalEvDistance = 0
    let totalFuelAmount = 0
    let totalFuelCost = 0
    let totalEnergy = 0
    let totalEnergyCost = 0
    let totalDays = 0

    let hevFuelAmount = 0
    let evEnergy = 0
    let completeEntryCount = 0

    for (let i = truncatedEntries.length - 1; i > 0; i--) {
      const current = truncatedEntries[i - 1]
      const previous = truncatedEntries[i]

      // Only count entries where both current and previous have complete HEV and EV ODO data
      if (current.hevOdo && current.evOdo && previous.hevOdo && previous.evOdo) {
        const distance = current.odo - previous.odo
        totalDistance += distance

        completeEntryCount++

        const hevDistance = current.hevOdo - previous.hevOdo
        totalHevDistance += hevDistance
        hevFuelAmount += current.fuelAmount

        const evDistance = current.evOdo - previous.evOdo
        totalEvDistance += evDistance

        const energy = current.pluginAmount - previous.pluginAmount
        evEnergy += energy

        totalFuelAmount += current.fuelAmount
        totalFuelCost += current.fuelCost

        totalEnergy += energy
        totalEnergyCost += energy * current.energyTariff

        const daysDiff = (new Date(current.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
        totalDays += daysDiff
        console.log("[v0] Adding days:", daysDiff, "from", previous.date, "to", current.date)
      }
    }

    console.log("[v0] Total days calculated:", totalDays)
    console.log("[v0] Complete entry count:", completeEntryCount)
    console.log("[v0] Total distance:", totalDistance)
    console.log("[v0] Total cost:", totalFuelCost + totalEnergyCost)

    const totalCost = totalFuelCost + totalEnergyCost
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
    const evCostPerKm = totalEvDistance > 0 ? totalEnergyCost / totalEvDistance : 0
    const hevCostPerKm = totalHevDistance > 0 ? totalFuelCost / totalHevDistance : 0

    const latestEntry = truncatedEntries[0]
    const costPerLiter = latestEntry.fuelAmount > 0 ? latestEntry.fuelCost / latestEntry.fuelAmount : 0

    const hevFuelEfficiency = totalHevDistance > 0 && hevFuelAmount > 0 ? totalHevDistance / hevFuelAmount : 0
    const evEfficiency = totalEvDistance > 0 && evEnergy > 0 ? totalEvDistance / evEnergy : 0

    // Combined efficiency: account for both fuel and energy cost converted to fuel equivalent
    const energyCostAsLiters = costPerLiter > 0 ? totalEnergyCost / costPerLiter : 0
    const combinedKmPerLiter =
      totalFuelAmount + energyCostAsLiters > 0 ? totalDistance / (totalFuelAmount + energyCostAsLiters) : 0

    // EV equivalent: what would efficiency be if energy cost was spent on fuel
    const evEquivalentKmPerLiter =
      evEfficiency > 0 && costPerLiter > 0 && latestEntry.energyTariff > 0
        ? evEfficiency * (costPerLiter / latestEntry.energyTariff)
        : 0

    const evWhPerKm = totalEvDistance > 0 && evEnergy > 0 ? (evEnergy * 1000) / totalEvDistance : 0
    const litersPer100km = combinedKmPerLiter > 0 ? 100 / combinedKmPerLiter : 0
    const hevLitersPer100km = hevFuelEfficiency > 0 ? 100 / hevFuelEfficiency : 0
    const evKwhPer100km = totalEvDistance > 0 && evEnergy > 0 ? (evEnergy * 100) / totalEvDistance : 0
    const evEquivalentLitersPer100km = evEquivalentKmPerLiter > 0 ? 100 / evEquivalentKmPerLiter : 0

    return {
      totalDistance,
      totalHevDistance,
      totalEvDistance,
      totalFuelAmount,
      totalFuelCost,
      totalEnergy,
      totalEnergyCost,
      totalCost,
      costPerKm,
      evCostPerKm,
      hevCostPerKm,
      combinedKmPerLiter,
      evEquivalentKmPerLiter,
      avgDistancePerDay: totalDays > 0 ? totalDistance / totalDays : 0,
      avgCostPerDay: totalDays > 0 ? totalCost / totalDays : 0,
      totalDays,
      entryCount: truncatedEntries.length,
      completeEntryCount,
      hevFuelAmount,
      evEnergy,
      hevFuelEfficiency,
      evEfficiency,
      litersPer100km,
      hevLitersPer100km,
      evKwhPer100km,
      evWhPerKm,
      evEquivalentLitersPer100km,
    }
  }

  console.log("[v0] Rendering Overview with entries:", entries.length);
  const metrics = entries && Array.isArray(entries) && entries.length > 0 ? calculateMetrics(entries) : null

  const currentVehicle = vehicleData?.vehicles.find((v) => v.id === vehicleData.currentVehicleId)
  const currencySymbol = getCurrencySymbol(currentVehicle?.currency || selectedCurrency)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <AppToolbar
          vehicles={vehicleData?.vehicles || []} // ADDED: Handle null vehicleData
          currentVehicleId={vehicleData?.currentVehicleId || ""} // ADDED: Handle null vehicleData
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          onRenameVehicle={handleRenameVehicle}
          onMenuClick={() => setMenuOpen(!menuOpen)}
        />
        <div className="container mx-auto p-4 md:p-8 max-w-7xl flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!entries) {
    return (
      <main className="min-h-screen bg-background">
        <AppToolbar
          vehicles={vehicleData?.vehicles || []} // ADDED: Handle null vehicleData
          currentVehicleId={vehicleData?.currentVehicleId || ""} // ADDED: Handle null vehicleData
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          onRenameVehicle={handleRenameVehicle}
          onMenuClick={() => setMenuOpen(!menuOpen)}
        />
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8 flex items-start justify-between">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Mileage Log
              </Button>
            </Link>
            {entries.length > 0 && (
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                  <SheetDescription className="sr-only">
                    Navigation menu with export options, currency settings, and theme toggle
                  </SheetDescription>
                  <nav className="flex flex-col h-full py-6">
                    <div className="px-3 space-y-1">
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                        onClick={() => setMenuOpen(false)}
                      >
                        <List className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Mileage Log</span>
                      </Link>

                      <div className="h-px bg-border my-3" />

                      <div className="px-4 py-3">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency Display</label>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-input hover:bg-accent/50 transition-colors text-sm"
                          tabIndex={-1}
                        >
                          <option value="USD">USD - US Dollar ($)</option>
                          <option value="EUR">EUR - Euro (€)</option>
                          <option value="GBP">GBP - British Pound (£)</option>
                          <option value="JPY">JPY - Japanese Yen (¥)</option>
                          <option value="CNY">CNY - Chinese Yuan (¥)</option>
                          <option value="INR">INR - Indian Rupee (₹)</option>
                          <option value="AUD">AUD - Australian Dollar (A$)</option>
                          <option value="CAD">CAD - Canadian Dollar (C$)</option>
                          <option value="CHF">CHF - Swiss Franc (CHF)</option>
                          <option value="KRW">KRW - South Korean Won (₩)</option>
                          <option value="SGD">SGD - Singapore Dollar (S$)</option>
                          <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                          <option value="SEK">SEK - Swedish Krona (kr)</option>
                          <option value="NOK">NOK - Norwegian Krone (kr)</option>
                          <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                          <option value="MXN">MXN - Mexican Peso (MX$)</option>
                          <option value="ZAR">ZAR - South African Rand (R)</option>
                          <option value="BRL">BRL - Brazilian Real (R$)</option>
                          <option value="TRY">TRY - Turkish Lira (₺)</option>
                          <option value="RUB">RUB - Russian Ruble (₽)</option>
                          <option value="PHP">PHP - Philippine Peso (₱)</option>
                        </select>
                      </div>

                      <div className="h-px bg-border my-3" />

                      <button
                        onClick={() => {
                          exportJSON(entries)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Export JSON</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCSV(entries, generateCSV)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Export CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          importInputRef.current?.click()
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Import Data</span>
                      </button>

                      <div className="h-px bg-border my-3" />

                      <button
                        onClick={() => {
                          toggleTheme()
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        {theme === "light" ? (
                          <>
                            <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="font-medium">Dark Mode</span>
                          </>
                        ) : (
                          <>
                            <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="font-medium">Light Mode</span>
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-2 px-4">
                        <button
                          onClick={() => {
                            setClearEntriesConfirm(vehicleData?.currentVehicleId || null)
                            setMenuOpen(false)
                          }}
                          disabled={!entries || entries.length === 0}
                          className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-orange-500/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span className="text-sm font-medium text-orange-500">Clear Log</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteVehicleConfirm(vehicleData?.currentVehicleId || null)
                            setMenuOpen(false)
                          }}
                          disabled={vehicleData?.vehicles.length === 1}
                          className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5 text-destructive group-hover:text-destructive transition-colors"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span className="text-sm font-medium text-destructive">Delete Vehicle</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto px-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setIsHelpOpen(true)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Help</span>
                      </button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
            <div className="text-center space-y-4 max-w-md">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Not enough data yet</h3>
              <p className="text-muted-foreground">
                Add more entries in the Mileage Log to see your vehicle's performance overview.
              </p>
              <Link href="/">
                <Button size="lg">Go to Mileage Log</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!metrics) {
    return (
      <main className="min-h-screen bg-background">
        <AppToolbar
          vehicles={vehicleData?.vehicles || []} // ADDED: Handle null vehicleData
          currentVehicleId={vehicleData?.currentVehicleId || ""} // ADDED: Handle null vehicleData
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          onRenameVehicle={handleRenameVehicle}
          onMenuClick={() => setMenuOpen(!menuOpen)}
        />
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8 flex items-start justify-between">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Mileage Log
              </Button>
            </Link>
            {entries.length > 0 && (
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                  <SheetDescription className="sr-only">
                    Navigation menu with export options, currency settings, and theme toggle
                  </SheetDescription>
                  <nav className="flex flex-col h-full py-6">
                    <div className="px-3 space-y-1">
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                        onClick={() => setMenuOpen(false)}
                      >
                        <List className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Mileage Log</span>
                      </Link>

                      <div className="h-px bg-border my-3" />

                      <div className="px-4 py-3">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency Display</label>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-input hover:bg-accent/50 transition-colors text-sm"
                          tabIndex={-1}
                        >
                          <option value="USD">USD - US Dollar ($)</option>
                          <option value="EUR">EUR - Euro (€)</option>
                          <option value="GBP">GBP - British Pound (£)</option>
                          <option value="JPY">JPY - Japanese Yen (¥)</option>
                          <option value="CNY">CNY - Chinese Yuan (¥)</option>
                          <option value="INR">INR - Indian Rupee (₹)</option>
                          <option value="AUD">AUD - Australian Dollar (A$)</option>
                          <option value="CAD">CAD - Canadian Dollar (C$)</option>
                          <option value="CHF">CHF - Swiss Franc (CHF)</option>
                          <option value="KRW">KRW - South Korean Won (₩)</option>
                          <option value="SGD">SGD - Singapore Dollar (S$)</option>
                          <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                          <option value="SEK">SEK - Swedish Krona (kr)</option>
                          <option value="NOK">NOK - Norwegian Krone (kr)</option>
                          <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                          <option value="MXN">MXN - Mexican Peso (MX$)</option>
                          <option value="ZAR">ZAR - South African Rand (R)</option>
                          <option value="BRL">BRL - Brazilian Real (R$)</option>
                          <option value="TRY">TRY - Turkish Lira (₺)</option>
                          <option value="RUB">RUB - Russian Ruble (₽)</option>
                          <option value="PHP">PHP - Philippine Peso (₱)</option>
                        </select>
                      </div>

                      <div className="h-px bg-border my-3" />

                      <button
                        onClick={() => {
                          exportJSON(entries)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Export JSON</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCSV(entries, generateCSV)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Export CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          importInputRef.current?.click()
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Import Data</span>
                      </button>

                      <div className="h-px bg-border my-3" />

                      <button
                        onClick={() => {
                          toggleTheme()
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        {theme === "light" ? (
                          <>
                            <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="font-medium">Dark Mode</span>
                          </>
                        ) : (
                          <>
                            <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="font-medium">Light Mode</span>
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-2 px-4">
                        <button
                          onClick={() => {
                            setClearEntriesConfirm(vehicleData?.currentVehicleId || null)
                            setMenuOpen(false)
                          }}
                          disabled={!entries || entries.length === 0}
                          className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-orange-500/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span className="text-sm font-medium text-orange-500">Clear Log</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteVehicleConfirm(vehicleData?.currentVehicleId || null)
                            setMenuOpen(false)
                          }}
                          disabled={vehicleData?.vehicles.length === 1}
                          className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="h-5 w-5 text-destructive group-hover:text-destructive transition-colors"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span className="text-sm font-medium text-destructive">Delete Vehicle</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto px-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          setIsHelpOpen(true)
                          setMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                      >
                        <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-medium">Help</span>
                      </button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
            <div className="text-center space-y-4 max-w-md">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Not enough data for selected period</h3>
              <p className="text-muted-foreground">
                The selected time range doesn't have enough entries to calculate metrics. Try selecting a different year
                or time range.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // ADDED: Render UI even if vehicleData is still loading (i.e., null)
  if (!vehicleData) {
    return (
      <main className="min-h-screen bg-background">
        <AppToolbar
          vehicles={[]} // ADDED: Handle null vehicleData
          currentVehicleId={""} // ADDED: Handle null vehicleData
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          onRenameVehicle={handleRenameVehicle}
          onMenuClick={() => setMenuOpen(!menuOpen)}
        />
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8 flex items-start justify-between">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Mileage Log
              </Button>
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetDescription className="sr-only">
                  Navigation menu with export options, currency settings, and theme toggle
                </SheetDescription>
                <nav className="flex flex-col h-full py-6">
                  <div className="px-3 space-y-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                      onClick={() => setMenuOpen(false)}
                    >
                      <List className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Mileage Log</span>
                    </Link>
                    <div className="h-px bg-border my-3" />
                    <div className="px-4 py-3">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency Display</label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-input hover:bg-accent/50 transition-colors text-sm"
                        tabIndex={-1}
                      >
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="GBP">GBP - British Pound (£)</option>
                        <option value="JPY">JPY - Japanese Yen (¥)</option>
                        <option value="CNY">CNY - Chinese Yuan (¥)</option>
                        <option value="INR">INR - Indian Rupee (₹)</option>
                        <option value="AUD">AUD - Australian Dollar (A$)</option>
                        <option value="CAD">CAD - Canadian Dollar (C$)</option>
                        <option value="CHF">CHF - Swiss Franc (CHF)</option>
                        <option value="KRW">KRW - South Korean Won (₩)</option>
                        <option value="SGD">SGD - Singapore Dollar (S$)</option>
                        <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                        <option value="SEK">SEK - Swedish Krona (kr)</option>
                        <option value="NOK">NOK - Norwegian Krone (kr)</option>
                        <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                        <option value="MXN">MXN - Mexican Peso (MX$)</option>
                        <option value="ZAR">ZAR - South African Rand (R)</option>
                        <option value="BRL">BRL - Brazilian Real (R$)</option>
                        <option value="TRY">TRY - Turkish Lira (₺)</option>
                        <option value="RUB">RUB - Russian Ruble (₽)</option>
                        <option value="PHP">PHP - Philippine Peso (₱)</option>
                      </select>
                    </div>
                    <div className="h-px bg-border my-3" />
                    <button
                      onClick={() => {
                        exportJSON(entries)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Export JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        exportCSV(entries, generateCSV)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Export CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        importInputRef.current?.click()
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Import Data</span>
                    </button>
                    <div className="h-px bg-border my-3" />
                    <button
                      onClick={() => {
                        toggleTheme()
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="font-medium">Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="font-medium">Light Mode</span>
                        </>
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-2 px-4">
                      <button
                        onClick={() => {
                          setClearEntriesConfirm(vehicleData?.currentVehicleId || null)
                          setMenuOpen(false)
                        }}
                        disabled={!entries || entries.length === 0}
                        className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-orange-500/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        <span className="text-sm font-medium text-orange-500">Clear Log</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteVehicleConfirm(vehicleData?.currentVehicleId || null)
                          setMenuOpen(false)
                        }}
                        disabled={vehicleData?.vehicles.length === 1} // ADDED: Handle null vehicleData
                        className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="h-5 w-5 text-destructive group-hover:text-destructive transition-colors"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span className="text-sm font-medium text-destructive">Delete Vehicle</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-auto px-3 pt-3 border-t">
                    <button
                      onClick={() => {
                        setIsHelpOpen(true)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Help</span>
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
            <div className="text-center space-y-4 max-w-md">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Loading vehicle data...</h3>
              <p className="text-muted-foreground">Please wait while your vehicle information is being loaded.</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <AppToolbar
        vehicles={vehicleData.vehicles}
        currentVehicleId={vehicleData.currentVehicleId}
        onSelectVehicle={handleSelectVehicle}
        onAddVehicle={handleAddVehicle}
        onRenameVehicle={handleRenameVehicle}
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Mileage Log
            </Button>
          </Link>
          {entries.length > 0 && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetDescription className="sr-only">
                  Navigation menu with export options, currency settings, and theme toggle
                </SheetDescription>
                <nav className="flex flex-col h-full py-6">
                  <div className="px-3 space-y-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                      onClick={() => setMenuOpen(false)}
                    >
                      <List className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Mileage Log</span>
                    </Link>

                    <div className="h-px bg-border my-3" />

                    <div className="px-4 py-3">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Currency Display</label>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-input hover:bg-accent/50 transition-colors text-sm"
                        tabIndex={-1}
                      >
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="GBP">GBP - British Pound (£)</option>
                        <option value="JPY">JPY - Japanese Yen (¥)</option>
                        <option value="CNY">CNY - Chinese Yuan (¥)</option>
                        <option value="INR">INR - Indian Rupee (₹)</option>
                        <option value="AUD">AUD - Australian Dollar (A$)</option>
                        <option value="CAD">CAD - Canadian Dollar (C$)</option>
                        <option value="CHF">CHF - Swiss Franc (CHF)</option>
                        <option value="KRW">KRW - South Korean Won (₩)</option>
                        <option value="SGD">SGD - Singapore Dollar (S$)</option>
                        <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                        <option value="SEK">SEK - Swedish Krona (kr)</option>
                        <option value="NOK">NOK - Norwegian Krone (kr)</option>
                        <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                        <option value="MXN">MXN - Mexican Peso (MX$)</option>
                        <option value="ZAR">ZAR - South African Rand (R)</option>
                        <option value="BRL">BRL - Brazilian Real (R$)</option>
                        <option value="TRY">TRY - Turkish Lira (₺)</option>
                        <option value="RUB">RUB - Russian Ruble (₽)</option>
                        <option value="PHP">PHP - Philippine Peso (₱)</option>
                      </select>
                    </div>

                    <div className="h-px bg-border my-3" />

                    <button
                      onClick={() => {
                        exportJSON(entries)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Export JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        exportCSV(entries, generateCSV)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Export CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        importInputRef.current?.click()
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Import Data</span>
                    </button>

                    <div className="h-px bg-border my-3" />

                    <button
                      onClick={() => {
                        toggleTheme()
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="font-medium">Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <span className="font-medium">Light Mode</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2 px-4">
                      <button
                        onClick={() => {
                          setClearEntriesConfirm(vehicleData?.currentVehicleId || null)
                          setMenuOpen(false)
                        }}
                        disabled={!entries || entries.length === 0}
                        className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-orange-500/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        <span className="text-sm font-medium text-orange-500">Clear Log</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteVehicleConfirm(vehicleData?.currentVehicleId || null)
                          setMenuOpen(false)
                        }}
                        disabled={vehicleData?.vehicles.length === 1}
                        className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="h-5 w-5 text-destructive group-hover:text-destructive transition-colors"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        <span className="text-sm font-medium text-destructive">Delete Vehicle</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto px-3 pt-3 border-t">
                    <button
                      onClick={() => {
                        setIsHelpOpen(true)
                        setMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                    >
                      <HelpCircle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="font-medium">Help</span>
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">
                    {distanceView === "total" ? "Total Distance" : "Distance/Day"}
                  </CardTitle>
                  <Popover
                    open={openPopover === "distance"}
                    onOpenChange={(open) => setOpenPopover(open ? "distance" : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Distance info</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="start">
                      <div className="space-y-1">
                        <p className="font-semibold">Total Distance:</p>
                        <p>Sum of all distances between entries</p>
                        <p className="text-xs">Distance = Current ODO - Previous ODO</p>
                        <p className="text-xs mt-1">Distance/Day = Total Distance ÷ Total Days</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => setDistanceView(distanceView === "total" ? "perDay" : "total")}
                    className="flex items-center gap-0.5 cursor-pointer"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${
                        distanceView === "total" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${
                        distanceView === "perDay"
                          ? "bg-primary border-primary"
                          : "bg-background border-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {distanceView === "total" ? (
                  <>
                    <div className="text-2xl font-bold">{metrics.totalDistance.toFixed(0)} km</div>
                    {metrics.totalEvDistance > 0 && (
                      <p className="text-xs text-muted-foreground">EV: {metrics.totalEvDistance.toFixed(0)} km</p>
                    )}
                    {metrics.totalHevDistance > 0 && (
                      <p className="text-xs text-muted-foreground">HEV: {metrics.totalHevDistance.toFixed(0)} km</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.avgDistancePerDay.toFixed(1)} km/day</div>
                    {metrics.totalEvDistance > 0 && metrics.totalDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        EV: {(metrics.totalEvDistance / metrics.totalDays).toFixed(1)} km/day
                      </p>
                    )}
                    {metrics.totalHevDistance > 0 && metrics.totalDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        HEV: {(metrics.totalHevDistance / metrics.totalDays).toFixed(1)} km/day
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">
                    {costView === "total" ? "Total Cost" : costView === "perKm" ? "Cost/km" : "Cost/Day"}
                  </CardTitle>
                  <Popover
                    open={openPopover === "totalCost"}
                    onOpenChange={(open) => setOpenPopover(open ? "totalCost" : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Cost info</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="start">
                      <div className="space-y-1.5">
                        <div>
                          <p className="font-semibold">Total Cost:</p>
                          <p className="text-xs">Fuel Cost + Energy Cost</p>
                        </div>
                        <div>
                          <p className="font-semibold">Cost per km:</p>
                          <p className="text-xs">Total Cost ÷ Total Distance</p>
                        </div>
                        <div>
                          <p className="font-semibold">Cost per Day:</p>
                          <p className="text-xs">Total Cost ÷ Total Days</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => {
                      if (costView === "total") setCostView("perKm")
                      else if (costView === "perKm") setCostView("perDay")
                      else setCostView("total")
                    }}
                    className="flex items-center gap-0.5 cursor-pointer"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${
                        costView === "total" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${
                        costView === "perKm" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${
                        costView === "perDay" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {costView === "total" ? (
                  <>
                    <div className="text-2xl font-bold">
                      {currencySymbol}
                      {metrics.totalCost.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fuel: {currencySymbol}
                      {metrics.totalFuelCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Energy: {currencySymbol}
                      {metrics.totalEnergyCost.toFixed(2)}
                    </p>
                  </>
                ) : costView === "perKm" ? (
                  <>
                    <div className="text-2xl font-bold">
                      {currencySymbol}
                      {metrics.costPerKm.toFixed(2)}/km
                    </div>
                    {metrics.evCostPerKm > 0 && (
                      <p className="text-xs text-muted-foreground">
                        EV: {currencySymbol}
                        {metrics.evCostPerKm.toFixed(2)}/km
                      </p>
                    )}
                    {metrics.hevCostPerKm > 0 && (
                      <p className="text-xs text-muted-foreground">
                        HEV: {currencySymbol}
                        {metrics.hevCostPerKm.toFixed(2)}/km
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {currencySymbol}
                      {metrics.avgCostPerDay.toFixed(2)}/day
                    </div>
                    {metrics.totalEnergyCost > 0 && metrics.totalDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Energy: {currencySymbol}
                        {(metrics.totalEnergyCost / metrics.totalDays).toFixed(2)}/day
                      </p>
                    )}
                    {metrics.totalFuelCost > 0 && metrics.totalDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Fuel: {currencySymbol}
                        {(metrics.totalFuelCost / metrics.totalDays).toFixed(2)}/day
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Efficiency & Consumption
                    <Popover
                      open={openPopover === "efficiency"}
                      onOpenChange={(open) => setOpenPopover(open ? "efficiency" : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Efficiency info</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm" align="start">
                        <div className="space-y-1.5">
                          <p className="font-semibold">Efficiency Metrics:</p>
                          {efficiencyUnit === "kmPer" ? (
                            <>
                              <div>
                                <p className="text-xs font-medium">Combined km/L:</p>
                                <p className="text-xs">Distance ÷ (Fuel + Energy Cost/Fuel Price per L)</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">HEV km/L:</p>
                                <p className="text-xs">HEV Distance ÷ Fuel Amount</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV Wh/km:</p>
                                <p className="text-xs">1000 ÷ (EV Distance ÷ Energy kWh)</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV as km/L*:</p>
                                <p className="text-xs">Cost-equivalent: EV distance if energy was fuel</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs font-medium">Combined L/100km:</p>
                                <p className="text-xs">100 ÷ Combined km/L</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">HEV L/100km:</p>
                                <p className="text-xs">100 ÷ HEV km/L</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV kWh/100km:</p>
                                <p className="text-xs">Energy × 100 ÷ EV Distance</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV as L/100km*:</p>
                                <p className="text-xs">100 ÷ EV km/L*</p>
                              </div>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button
                      onClick={() => setEfficiencyUnit(efficiencyUnit === "kmPer" ? "per100" : "kmPer")}
                      className="flex gap-1 ml-2"
                      type="button"
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${
                          efficiencyUnit === "kmPer"
                            ? "bg-primary border-primary"
                            : "bg-background border-muted-foreground"
                        }`}
                      />
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${
                          efficiencyUnit === "per100"
                            ? "bg-primary border-primary"
                            : "bg-background border-muted-foreground"
                        }`}
                      />
                    </button>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Gauge className="h-3 w-3" />
                      <span className="text-xs">Combined</span>
                    </div>
                    <div className="text-lg font-bold">
                      {efficiencyUnit === "kmPer"
                        ? `${metrics.combinedKmPerLiter.toFixed(2)} km/L`
                        : `${metrics.litersPer100km.toFixed(2)} L/100km`}
                    </div>
                    <p className="text-xs text-muted-foreground">Fuel + energy cost equivalent</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Fuel className="h-3 w-3" />
                      <span className="text-xs">HEV Fuel</span>
                    </div>
                    <div className="text-lg font-bold">
                      {metrics.totalHevDistance > 0 && metrics.hevFuelAmount > 0
                        ? efficiencyUnit === "kmPer"
                          ? `${metrics.hevFuelEfficiency.toFixed(2)} km/L`
                          : `${metrics.hevLitersPer100km.toFixed(2)} L/100km`
                        : "No HEV data"}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.hevFuelAmount.toFixed(1)} L consumed</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">EV Energy</span>
                    </div>
                    <div className="text-lg font-bold">
                      {metrics.totalEvDistance > 0 && metrics.evEnergy > 0
                        ? efficiencyUnit === "kmPer"
                          ? `${metrics.evWhPerKm.toFixed(0)} Wh/km`
                          : `${metrics.evKwhPer100km.toFixed(2)} kWh/100km`
                        : "No EV data"}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.evEnergy.toFixed(1)} kWh consumed</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">EV as {efficiencyUnit === "kmPer" ? "km/L*" : "L/100km*"}</span>
                    </div>
                    <div className="text-lg font-bold">
                      {efficiencyUnit === "kmPer"
                        ? `${metrics.evEquivalentKmPerLiter.toFixed(2)} km/L`
                        : `${metrics.evEquivalentLitersPer100km.toFixed(2)} L/100km`}
                    </div>
                    <p className="text-xs text-muted-foreground">Cost-equivalent efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.totalDays)} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {metrics.completeEntryCount} complete entries
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ADDED: AlertDialog for clearing entries */}
      <AlertDialog open={clearEntriesConfirm !== null} onOpenChange={() => setClearEntriesConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Mileage Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all mileage entries for this vehicle. The
              vehicle itself will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearEntries} className="bg-orange-500 text-white hover:bg-orange-600">
              Clear All Entries
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteVehicleConfirm !== null} onOpenChange={() => setDeleteVehicleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle and all its mileage entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </main>
  )
}
