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
        date: "2025-08-26",
        odo: 16138,
        fuelAmount: 36.07,
        fuelCost: 2130.06,
        pluginAmount: 744.8,
        energyTariff: 14,
        id: "2caa8c91-1e01-4bc4-a53b-7ec0b786596a",
      },
      {
        date: "2025-09-19",
        odo: 17590,
        fuelAmount: 44.42,
        fuelCost: 2411.9,
        pluginAmount: 906.8,
        energyTariff: 14,
        id: "3543f5e7-29cc-4b18-8816-03176053ece0",
      },
      {
        date: "2025-10-29",
        odo: 19587,
        fuelAmount: 40.76,
        fuelCost: 2278.31,
        pluginAmount: 1167.2,
        energyTariff: 14,
        id: "6cb6dbe5-5025-425a-ab2a-e1204f4a751f",
      },
      {
        date: "2025-11-13",
        hevOdo: 9511,
        evOdo: 11525,
        odo: 21036,
        fuelAmount: 48.11,
        fuelCost: 2870,
        pluginAmount: 1288,
        energyTariff: 14,
        id: "c6e58737-f3da-44f8-b997-8b80ba9670a2",
      },
      {
        date: "2025-12-09",
        hevOdo: 10069,
        evOdo: 12352,
        odo: 22420,
        fuelAmount: 46.25,
        fuelCost: 2730.94,
        pluginAmount: 1420.4,
        energyTariff: 14,
        id: "44ee236f-8a29-44d2-afb4-d863387f6f0a",
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
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mileage Log</h1>
            <p className="text-muted-foreground">Track your hybrid vehicle's fuel and electric consumption</p>
          </div>
          {entries.length > 0 && (
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

                    <button
                      onClick={() => {
                        setDeleteVehicleConfirm(vehicleData?.currentVehicleId || null)
                        setMenuOpen(false)
                      }}
                      disabled={vehicleData?.vehicles.length === 1}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-left w-full group disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span className="font-medium text-destructive">Delete Vehicle</span>
                    </button>
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
              className="fixed bottom-6 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
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

        <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the mileage entry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
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
