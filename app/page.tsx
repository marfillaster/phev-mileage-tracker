"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MileageEntryForm } from "@/components/mileage-entry-form"
import { MileageTable, generateCSV } from "@/components/mileage-table"
import { InstallPrompt } from "@/components/install-prompt"
import { HelpInstructions } from "@/components/help-instructions"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Plus, Menu, Download, Upload, Moon, Sun, HelpCircle, FileText, BarChart3 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

export default function Page() {
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const stored = localStorage.getItem("phev-mileage-entries")
    if (stored) {
      setEntries(JSON.parse(stored))
    }
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
  }, [])

  const handleAddEntry = (entry: Omit<MileageEntry, "id">) => {
    if (editingEntry) {
      const updatedEntries = entries.map((e) => (e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e))
      setEntries(updatedEntries)
      localStorage.setItem("phev-mileage-entries", JSON.stringify(updatedEntries))
      setEditingEntry(null)
    } else {
      const newEntry = {
        ...entry,
        id: crypto.randomUUID(),
      }
      const updatedEntries = [...entries, newEntry]
      setEntries(updatedEntries)
      localStorage.setItem("phev-mileage-entries", JSON.stringify(updatedEntries))
    }
    setIsFormOpen(false)
  }

  const handleDeleteEntry = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const updatedEntries = entries.filter((entry) => entry.id !== deleteConfirmId)
      setEntries(updatedEntries)
      localStorage.setItem("phev-mileage-entries", JSON.stringify(updatedEntries))
      setDeleteConfirmId(null)
    }
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
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedData)) {
          setEntries(importedData)
          localStorage.setItem("phev-mileage-entries", JSON.stringify(importedData))
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

  if (!isLoaded) {
    return null
  }

  const navigationState = getNavigationState()

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Mileage Log</h1>
            <p className="text-muted-foreground">Track your hybrid vehicle's fuel and electric consumption</p>
          </div>
          {entries.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/overview" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsHelpOpen(true)}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            </div>
          </div>
        ) : (
          <>
            <MileageTable entries={entries} onDelete={handleDeleteEntry} onEdit={handleEditEntry} />
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
          onClose={handleCloseForm}
          onSubmit={handleAddEntry}
          editEntry={editingEntry}
          onNavigatePrevious={handleNavigatePrevious}
          onNavigateNext={handleNavigateNext}
          hasPrevious={navigationState.hasPrevious}
          hasNext={navigationState.hasNext}
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
      </div>
      <Footer />
    </main>
  )
}
