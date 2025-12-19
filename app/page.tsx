"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MileageEntryForm } from "@/components/mileage-entry-form"
import { MileageTable, generateCSV } from "@/components/mileage-table"
import { InstallPrompt } from "@/components/install-prompt"
import { HelpInstructions } from "@/components/help-instructions"
import { Footer } from "@/components/footer"
import { AppToolbar } from "@/components/app-toolbar"
import { Button } from "@/components/ui/button"
import { Plus, Download, Upload, Moon, Sun, HelpCircle, FileText, BarChart3 } from "lucide-react"
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet"
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
import { useTheme } from "@/components/theme-provider"
import Link from "next/link"
import {
  loadVehicleData,
  saveVehicleData,
  deleteVehicle,
  clearVehicleEntries,
  type MileageEntry,
  type VehicleData,
  getCurrencySymbol,
  updateVehicleCurrency,
} from "@/lib/vehicle-storage"

export type { MileageEntry }

export default function MileageTracker() {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [selectedCurrency, setSelectedCurrency] = useState<string>("PHP")
  const [clearEntriesConfirm, setClearEntriesConfirm] = useState<string | null>(null)

  useEffect(() => {
    const data = loadVehicleData()
    setVehicleData(data)
    setEntries(data.entries[data.currentVehicleId] || [])

    const hasSeenHelp = localStorage.getItem("phev-has-seen-help")
    if (!hasSeenHelp) {
      setIsHelpOpen(true)
      localStorage.setItem("phev-has-seen-help", "true")
    }
    setIsLoaded(true)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log("[v0] Service Worker registered:", registration)

          // Check for updates every 30 seconds
          setInterval(() => {
            registration.update()
          }, 30000)

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available, reload to activate
                  console.log("[v0] New version available, reloading...")
                  window.location.reload()
                }
              })
            }
          })
        },
        (error) => {
          console.log("[v0] Service Worker registration failed:", error)
        },
      )
    }

    const currentVehicle = data.vehicles.find((v) => v.id === data.currentVehicleId)
    if (currentVehicle?.currency) {
      setSelectedCurrency(currentVehicle.currency)
    }
  }, [])

  useEffect(() => {
    if (vehicleData) {
      const currentVehicle = vehicleData.vehicles.find((v) => v.id === vehicleData.currentVehicleId)
      if (currentVehicle?.currency && currentVehicle.currency !== selectedCurrency) {
        setSelectedCurrency(currentVehicle.currency)
      }
    }
  }, [vehicleData])

  const handleSelectVehicle = (vehicleId: string) => {
    if (!vehicleData) return
    const updatedData = {
      ...vehicleData,
      currentVehicleId: vehicleId,
    }
    setVehicleData(updatedData)
    setEntries(updatedData.entries[vehicleId] || [])
    saveVehicleData(updatedData)
  }

  const handleAddVehicle = (name: string) => {
    if (!vehicleData) return
    const newVehicle = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      currency: selectedCurrency,
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
    setEntries([])
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
    setEntries(updatedData.entries[updatedData.currentVehicleId] || [])
    saveVehicleData(updatedData)
    setDeleteVehicleConfirm(null)
  }

  const handleClearEntries = () => {
    if (!vehicleData || !clearEntriesConfirm) return

    const updatedData = clearVehicleEntries(vehicleData, clearEntriesConfirm)
    setVehicleData(updatedData)
    setEntries([])
    saveVehicleData(updatedData)
    setClearEntriesConfirm(null)
  }

  const handleAddEntry = (entry: Omit<MileageEntry, "id">) => {
    if (!vehicleData) return

    const currentVehicleId = vehicleData.currentVehicleId
    const currentEntries = vehicleData.entries[currentVehicleId] || []

    if (editingEntry) {
      const updatedEntries = currentEntries.map((e) =>
        e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e,
      )
      const updatedData = {
        ...vehicleData,
        entries: {
          ...vehicleData.entries,
          [currentVehicleId]: updatedEntries,
        },
      }
      setVehicleData(updatedData)
      setEntries(updatedEntries)
      saveVehicleData(updatedData)
      setEditingEntry(null)
    } else {
      const newEntry = {
        ...entry,
        id: crypto.randomUUID(),
      }
      const updatedEntries = [...currentEntries, newEntry]
      const updatedData = {
        ...vehicleData,
        entries: {
          ...vehicleData.entries,
          [currentVehicleId]: updatedEntries,
        },
      }
      setVehicleData(updatedData)
      setEntries(updatedEntries)
      saveVehicleData(updatedData)
    }
    setIsFormOpen(false)
  }

  const handleDeleteEntry = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (!vehicleData || !deleteConfirmId) return

    const currentVehicleId = vehicleData.currentVehicleId
    const currentEntries = vehicleData.entries[currentVehicleId] || []
    const updatedEntries = currentEntries.filter((entry) => entry.id !== deleteConfirmId)

    const updatedData = {
      ...vehicleData,
      entries: {
        ...vehicleData.entries,
        [currentVehicleId]: updatedEntries,
      },
    }
    setVehicleData(updatedData)
    setEntries(updatedEntries)
    saveVehicleData(updatedData)
    setDeleteConfirmId(null)
  }

  const handleEditEntry = (entry: MileageEntry) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEntry(null)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `phev-mileage-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csvContent = generateCSV(entries)
    const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `phev-mileage-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!vehicleData) return

    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedData)) {
          const currentVehicleId = vehicleData.currentVehicleId
          const updatedData = {
            ...vehicleData,
            entries: {
              ...vehicleData.entries,
              [currentVehicleId]: importedData,
            },
          }
          setVehicleData(updatedData)
          setEntries(importedData)
          saveVehicleData(updatedData)
        } else {
          alert("Invalid file format. Please upload a valid JSON file.")
        }
      } catch (error) {
        alert("Error reading file. Please make sure it's a valid JSON file.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleImportDummyData = () => {
    if (!vehicleData) return

    const dummyData: MileageEntry[] = [
      {
        date: "2024-09-05",
        hevOdo: 0,
        evOdo: 0,
        odo: 0,
        fuelAmount: 45.3,
        fuelCost: 2543.85,
        pluginAmount: 0,
        energyTariff: 13.5,
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      },
      {
        date: "2024-10-02",
        hevOdo: 510,
        evOdo: 770,
        odo: 1280,
        fuelAmount: 42.8,
        fuelCost: 2471.92,
        pluginAmount: 115,
        energyTariff: 14.2,
        id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      },
      {
        date: "2024-10-28",
        hevOdo: 1060,
        evOdo: 1610,
        odo: 2670,
        fuelAmount: 46.5,
        fuelCost: 2660.7,
        pluginAmount: 248,
        energyTariff: 13.8,
        id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      },
      {
        date: "2024-11-25",
        hevOdo: 1540,
        evOdo: 2350,
        odo: 3890,
        fuelAmount: 40.2,
        fuelCost: 2291.4,
        pluginAmount: 359,
        energyTariff: 14.0,
        id: "d4e5f6a7-b8c9-0123-def1-234567890123",
      },
      {
        date: "2024-12-20",
        hevOdo: 2100,
        evOdo: 3220,
        odo: 5320,
        fuelAmount: 47.8,
        fuelCost: 2772.6,
        pluginAmount: 489,
        energyTariff: 15.5,
        id: "e5f6a7b8-c9d0-1234-ef12-345678901234",
      },
      {
        date: "2025-01-18",
        hevOdo: 2640,
        evOdo: 4050,
        odo: 6690,
        fuelAmount: 45.1,
        fuelCost: 2539.3,
        pluginAmount: 614,
        energyTariff: 15.0,
        id: "f6a7b8c9-d0e1-2345-f123-456789012345",
      },
      {
        date: "2025-02-15",
        hevOdo: 3230,
        evOdo: 4970,
        odo: 8200,
        fuelAmount: 49.5,
        fuelCost: 2872.65,
        pluginAmount: 752,
        energyTariff: 14.5,
        id: "a7b8c9d0-e1f2-3456-1234-567890123456",
      },
      {
        date: "2025-03-14",
        hevOdo: 3720,
        evOdo: 5720,
        odo: 9440,
        fuelAmount: 41.3,
        fuelCost: 2395.44,
        pluginAmount: 868,
        energyTariff: 14.8,
        id: "b8c9d0e1-f2a3-4567-2345-678901234567",
      },
      {
        date: "2025-04-10",
        hevOdo: 4290,
        evOdo: 6610,
        odo: 10900,
        fuelAmount: 47.7,
        fuelCost: 2766.66,
        pluginAmount: 1001,
        energyTariff: 15.2,
        id: "c9d0e1f2-a3b4-5678-3456-789012345678",
      },
      {
        date: "2025-05-08",
        hevOdo: 4850,
        evOdo: 7470,
        odo: 12320,
        fuelAmount: 46.9,
        fuelCost: 2722.67,
        pluginAmount: 1134,
        energyTariff: 14.3,
        id: "d0e1f2a3-b4c5-6789-4567-890123456789",
      },
      {
        date: "2025-06-05",
        hevOdo: 5380,
        evOdo: 8270,
        odo: 13650,
        fuelAmount: 44.4,
        fuelCost: 2574.96,
        pluginAmount: 1257,
        energyTariff: 13.9,
        id: "e1f2a3b4-c5d6-7890-5678-901234567890",
      },
      {
        date: "2025-07-02",
        hevOdo: 5960,
        evOdo: 9180,
        odo: 15140,
        fuelAmount: 48.6,
        fuelCost: 2818.62,
        pluginAmount: 1397,
        energyTariff: 14.7,
        id: "f2a3b4c5-d6e7-8901-6789-012345678901",
      },
      {
        date: "2025-07-30",
        hevOdo: 6440,
        evOdo: 9850,
        odo: 16290,
        fuelAmount: 40.1,
        fuelCost: 2325.8,
        pluginAmount: 1501,
        energyTariff: 15.1,
        id: "a3b4c5d6-e7f8-9012-7890-123456789012",
      },
      {
        date: "2025-08-27",
        hevOdo: 7020,
        evOdo: 10740,
        odo: 17760,
        fuelAmount: 48.5,
        fuelCost: 2813.0,
        pluginAmount: 1639,
        energyTariff: 14.6,
        id: "b4c5d6e7-f8a9-0123-8901-234567890123",
      },
      {
        date: "2025-09-23",
        hevOdo: 7540,
        evOdo: 11520,
        odo: 19060,
        fuelAmount: 43.5,
        fuelCost: 2523.45,
        pluginAmount: 1759,
        energyTariff: 13.7,
        id: "c5d6e7f8-a9b0-1234-9012-345678901234",
      },
      {
        date: "2025-10-20",
        hevOdo: 8110,
        evOdo: 12420,
        odo: 20530,
        fuelAmount: 47.7,
        fuelCost: 2766.6,
        pluginAmount: 1898,
        energyTariff: 14.9,
        id: "d6e7f8a9-b0c1-2345-0123-456789012345",
      },
      {
        date: "2025-11-16",
        hevOdo: 8590,
        evOdo: 13140,
        odo: 21730,
        fuelAmount: 40.2,
        fuelCost: 2331.6,
        pluginAmount: 2009,
        energyTariff: 15.3,
        id: "e7f8a9b0-c1d2-3456-1234-567890123456",
      },
      {
        date: "2025-12-13",
        hevOdo: 9190,
        evOdo: 14070,
        odo: 23260,
        fuelAmount: 50.2,
        fuelCost: 2911.6,
        pluginAmount: 2152,
        energyTariff: 14.1,
        id: "f8a9b0c1-d2e3-4567-2345-678901234567",
      },
      {
        date: "2025-12-19",
        hevOdo: 9450,
        evOdo: 14460,
        odo: 23910,
        fuelAmount: 21.8,
        fuelCost: 1263.92,
        pluginAmount: 2212,
        energyTariff: 14.4,
        id: "a9b0c1d2-e3f4-5678-3456-789012345678",
      },
    ]

    const currentVehicleId = vehicleData.currentVehicleId
    const updatedData = {
      ...vehicleData,
      entries: {
        ...vehicleData.entries,
        [currentVehicleId]: dummyData,
      },
    }
    setVehicleData(updatedData)
    setEntries(dummyData)
    saveVehicleData(updatedData)
  }

  const getSortedEntries = () => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const handleNavigatePrevious = () => {
    if (!editingEntry) return
    const sortedEntries = getSortedEntries()
    const currentIndex = sortedEntries.findIndex((e) => e.id === editingEntry.id)
    if (currentIndex > 0) {
      setEditingEntry(sortedEntries[currentIndex - 1])
    }
  }

  const handleNavigateNext = () => {
    if (!editingEntry) return
    const sortedEntries = getSortedEntries()
    const currentIndex = sortedEntries.findIndex((e) => e.id === editingEntry.id)
    if (currentIndex < sortedEntries.length - 1) {
      setEditingEntry(sortedEntries[currentIndex + 1])
    }
  }

  const getNavigationState = () => {
    if (!editingEntry) return { hasPrevious: false, hasNext: false }
    const sortedEntries = getSortedEntries()
    const currentIndex = sortedEntries.findIndex((e) => e.id === editingEntry.id)
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < sortedEntries.length - 1,
    }
  }

  const handleCurrencyChange = (currency: string) => {
    if (!vehicleData) return
    const updated = updateVehicleCurrency(vehicleData, vehicleData.currentVehicleId, currency)
    setVehicleData(updated)
    saveVehicleData(updated)
    setSelectedCurrency(currency)
  }

  if (!isLoaded || !vehicleData) {
    return null
  }

  const currentVehicle = vehicleData?.vehicles.find((v) => v.id === vehicleData.currentVehicleId)
  const currencySymbol = getCurrencySymbol(currentVehicle?.currency || selectedCurrency)

  const navigationState = getNavigationState()

  return (
    <main className="min-h-screen bg-background overflow-y-auto">
      <AppToolbar
        vehicles={vehicleData.vehicles}
        currentVehicleId={vehicleData.currentVehicleId}
        onSelectVehicle={handleSelectVehicle}
        onAddVehicle={handleAddVehicle}
        onRenameVehicle={handleRenameVehicle}
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      <div className="container mx-auto p-4 md:p-8 max-w-7xl pt-20 pb-28">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mileage Log</h1>
            <p className="text-muted-foreground">Track your hybrid vehicle's fuel and electric consumption</p>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
              <SheetDescription className="sr-only">
                Navigation menu with export options, currency settings, and theme toggle
              </SheetDescription>
              <nav className="flex flex-col h-full py-6">
                <div className="px-3 space-y-1">
                  <Link
                    href="/overview"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-medium">Overview</span>
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
                      handleExport()
                      setMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 text-left w-full group"
                  >
                    <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-medium">Export JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportCSV()
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
                      disabled={entries.length === 0}
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
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-foreground">No entries yet</h3>
              <p className="text-muted-foreground">Start tracking your mileage by adding your first entry</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setIsFormOpen(true)} size="lg">
                  Add Entry
                </Button>
                <Button onClick={() => importInputRef.current?.click()} variant="outline" size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                or{" "}
                <button
                  onClick={handleImportDummyData}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  import dummy data
                </button>
              </p>
            </div>
          </div>
        ) : (
          <>
            <MileageTable
              entries={entries}
              onDelete={handleDeleteEntry}
              onUpdate={handleEditEntry} // Changed from onEdit to onUpdate to match component's expected prop
              currencySymbol={currencySymbol}
            />
            <button
              onClick={() => setIsFormOpen(true)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center z-40"
              aria-label="Add new entry"
            >
              <Plus className="h-6 w-6" />
            </button>
          </>
        )}

        <input ref={importInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

        <MileageEntryForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setEditingEntry(null)
          }}
          onSubmit={editingEntry ? handleAddEntry : handleAddEntry}
          editEntry={editingEntry}
          onNavigatePrevious={handleNavigatePrevious}
          onNavigateNext={handleNavigateNext}
          {...navigationState}
          currency={selectedCurrency}
          entries={entries}
        />
        <InstallPrompt />
        <HelpInstructions open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

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
      </div>
      <Footer />
    </main>
  )
}
