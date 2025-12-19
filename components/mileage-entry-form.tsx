"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import type { MileageEntry } from "@/app/page"
import { getCurrencySymbol } from "@/lib/vehicle-storage"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MileageEntryFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (entry: Omit<MileageEntry, "id">) => void
  editEntry?: MileageEntry | null
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  currency?: string
  entries?: MileageEntry[]
}

export function MileageEntryForm({
  open,
  onClose,
  onSubmit,
  editEntry,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  currency = "PHP",
  entries = [],
}: MileageEntryFormProps) {
  const getLatestEntry = () => {
    if (entries.length === 0) return null
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sortedEntries[0]
  }

  const getLatestEnergyTariff = () => {
    if (entries.length === 0) return ""
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sortedEntries[0]?.energyTariff?.toString() || ""
  }

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    hevOdo: "",
    evOdo: "",
    odo: "",
    fuelAmount: "",
    fuelCost: "",
    pluginAmount: "",
    energyTariff: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editEntry) {
      setFormData({
        date: editEntry.date,
        hevOdo: editEntry.hevOdo?.toString() || "",
        evOdo: editEntry.evOdo?.toString() || "",
        odo: editEntry.odo?.toString() || "",
        fuelAmount: editEntry.fuelAmount?.toString() || "",
        fuelCost: editEntry.fuelCost?.toString() || "",
        pluginAmount: editEntry.pluginAmount?.toString() || "",
        energyTariff: editEntry.energyTariff?.toString() || "",
      })
    } else {
      const latestEntry = getLatestEntry()
      setFormData({
        date: new Date().toISOString().split("T")[0],
        hevOdo: latestEntry?.hevOdo?.toString() || "",
        evOdo: latestEntry?.evOdo?.toString() || "",
        odo: latestEntry?.odo?.toString() || "",
        fuelAmount: "",
        fuelCost: "",
        pluginAmount: latestEntry?.pluginAmount?.toString() || "",
        energyTariff: getLatestEnergyTariff(),
      })
    }
    setErrors({})
  }, [editEntry, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    const odo = Number.parseFloat(formData.odo)
    const hevOdo = Number.parseFloat(formData.hevOdo)
    const evOdo = Number.parseFloat(formData.evOdo)

    if (!formData.odo || Number.isNaN(odo)) {
      newErrors.odo = "ODO is required"
    } else if (odo <= 0) {
      newErrors.odo = "ODO must be a positive number"
    }

    if (!formData.hevOdo || Number.isNaN(hevOdo)) {
      newErrors.hevOdo = "HEV ODO is required"
    } else if (hevOdo <= 0) {
      newErrors.hevOdo = "HEV ODO must be a positive number"
    }

    if (!formData.evOdo || Number.isNaN(evOdo)) {
      newErrors.evOdo = "EV ODO is required"
    } else if (evOdo < 0) {
      newErrors.evOdo = "EV ODO cannot be negative"
    }

    if (!Number.isNaN(odo) && !Number.isNaN(hevOdo) && !Number.isNaN(evOdo)) {
      const sum = hevOdo + evOdo
      const tolerance = 0.1
      if (Math.abs(odo - sum) > tolerance) {
        newErrors.odo = `ODO must equal HEV ODO + EV ODO (${sum.toFixed(1)})`
      }
    }

    const fuelAmount = Number.parseFloat(formData.fuelAmount)
    if (!formData.fuelAmount || Number.isNaN(fuelAmount)) {
      newErrors.fuelAmount = "Fuel amount is required"
    } else if (fuelAmount < 0) {
      newErrors.fuelAmount = "Fuel amount cannot be negative"
    }

    const fuelCost = Number.parseFloat(formData.fuelCost)
    if (!formData.fuelCost || Number.isNaN(fuelCost)) {
      newErrors.fuelCost = "Fuel cost is required"
    } else if (fuelCost < 0) {
      newErrors.fuelCost = "Fuel cost cannot be negative"
    }

    const pluginAmount = Number.parseFloat(formData.pluginAmount)
    if (!formData.pluginAmount || Number.isNaN(pluginAmount)) {
      newErrors.pluginAmount = "Plug-in amount is required"
    } else if (pluginAmount < 0) {
      newErrors.pluginAmount = "Plug-in amount cannot be negative"
    }

    const energyTariff = Number.parseFloat(formData.energyTariff)
    if (!formData.energyTariff || Number.isNaN(energyTariff)) {
      newErrors.energyTariff = "Energy tariff is required"
    } else if (energyTariff <= 0) {
      newErrors.energyTariff = "Energy tariff must be a positive number"
    }

    if (fuelAmount === 0 && pluginAmount === 0) {
      newErrors.general = "At least fuel or plug-in energy must be greater than zero"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit({
      date: formData.date,
      ...(formData.hevOdo && { hevOdo: Number.parseFloat(formData.hevOdo) }),
      ...(formData.evOdo && { evOdo: Number.parseFloat(formData.evOdo) }),
      odo: Number.parseFloat(formData.odo),
      fuelAmount: Number.parseFloat(formData.fuelAmount),
      fuelCost: Number.parseFloat(formData.fuelCost),
      pluginAmount: Number.parseFloat(formData.pluginAmount),
      energyTariff: Number.parseFloat(formData.energyTariff),
    })
    setFormData({
      date: new Date().toISOString().split("T")[0],
      hevOdo: "",
      evOdo: "",
      odo: "",
      fuelAmount: "",
      fuelCost: "",
      pluginAmount: "",
      energyTariff: getLatestEnergyTariff(),
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const currencySymbol = getCurrencySymbol(currency)

  const FieldHelp = ({ content }: { content: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 ml-1 text-muted-foreground hover:text-foreground cursor-help transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="text-sm max-w-xs">{content}</PopoverContent>
    </Popover>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            {editEntry && (onNavigatePrevious || onNavigateNext) && (
              <>
                {onNavigatePrevious && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onNavigatePrevious}
                    disabled={!hasPrevious}
                    className="shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {!onNavigatePrevious && <div className="w-10 shrink-0" />}
              </>
            )}
            <DialogTitle className="flex-1 text-center">
              {editEntry ? "Edit Mileage Entry" : "Add Mileage Entry"}
            </DialogTitle>
            {editEntry && (onNavigatePrevious || onNavigateNext) && (
              <>
                {onNavigateNext && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onNavigateNext}
                    disabled={!hasNext}
                    className="shrink-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
                {!onNavigateNext && <div className="w-10 shrink-0" />}
              </>
            )}
          </div>
          <DialogDescription className="sr-only">
            {editEntry
              ? "Edit your mileage entry details"
              : "Add a new mileage entry with ODO readings, fuel, and energy data"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{errors.general}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center">
              Date <span className="text-destructive">*</span>
              <FieldHelp content="The date when you recorded the mileage readings. Pre-filled with today's date." />
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              ODO Readings (km)
              <FieldHelp content="Total distance readings from your vehicle's dashboard. ODO must equal HEV ODO + EV ODO. Find these readings on your instrument cluster." />
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="odo" className="text-xs">
                  ODO <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="odo"
                  type="number"
                  step="0.1"
                  value={formData.odo}
                  onChange={(e) => handleChange("odo", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hevOdo" className="text-xs">
                  HEV ODO <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="hevOdo"
                  type="number"
                  step="0.1"
                  value={formData.hevOdo}
                  onChange={(e) => handleChange("hevOdo", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="evOdo" className="text-xs">
                  EV ODO <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="evOdo"
                  type="number"
                  step="0.1"
                  value={formData.evOdo}
                  onChange={(e) => handleChange("evOdo", e.target.value)}
                  required
                />
              </div>
            </div>
            {(errors.odo || errors.hevOdo || errors.evOdo) && (
              <div className="space-y-1">
                {errors.odo && <p className="text-sm text-destructive">{errors.odo}</p>}
                {errors.hevOdo && <p className="text-sm text-destructive">{errors.hevOdo}</p>}
                {errors.evOdo && <p className="text-sm text-destructive">{errors.evOdo}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              Fuel
              <FieldHelp content="Amount of gasoline refueled in liters. Find this on your fuel receipt at the gas station." />
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fuelAmount" className="text-xs">
                  Amount (L) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fuelAmount"
                  type="number"
                  step="0.01"
                  value={formData.fuelAmount}
                  onChange={(e) => handleChange("fuelAmount", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fuelCost" className="text-xs">
                  Cost ({currencySymbol}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fuelCost"
                  type="number"
                  step="0.01"
                  value={formData.fuelCost}
                  onChange={(e) => handleChange("fuelCost", e.target.value)}
                  required
                />
              </div>
            </div>
            {(errors.fuelAmount || errors.fuelCost) && (
              <div className="space-y-1">
                {errors.fuelAmount && <p className="text-sm text-destructive">{errors.fuelAmount}</p>}
                {errors.fuelCost && <p className="text-sm text-destructive">{errors.fuelCost}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              Energy
              <FieldHelp content="Amount of cumulative electricity charged (kWh) and the tariff rate. Find plug-in amount in your vehicle's infotainment energy settings page. Check your electric bill for the tariff rate per kWh." />
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pluginAmount" className="text-xs">
                  Plug-in (kWh) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pluginAmount"
                  type="number"
                  step="0.01"
                  value={formData.pluginAmount}
                  onChange={(e) => handleChange("pluginAmount", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="energyTariff" className="text-xs">
                  Tariff ({currencySymbol}/kWh) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="energyTariff"
                  type="number"
                  step="0.01"
                  value={formData.energyTariff}
                  onChange={(e) => handleChange("energyTariff", e.target.value)}
                  required
                />
              </div>
            </div>
            {(errors.pluginAmount || errors.energyTariff) && (
              <div className="space-y-1">
                {errors.pluginAmount && <p className="text-sm text-destructive">{errors.pluginAmount}</p>}
                {errors.energyTariff && <p className="text-sm text-destructive">{errors.energyTariff}</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editEntry ? "Update Entry" : "Add Entry"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
