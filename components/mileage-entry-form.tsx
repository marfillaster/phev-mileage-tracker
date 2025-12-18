"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { MileageEntry } from "@/app/page"

interface MileageEntryFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (entry: Omit<MileageEntry, "id">) => void
  editEntry?: MileageEntry | null
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
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
}: MileageEntryFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    hevOdo: "",
    evOdo: "",
    odo: "",
    fuelAmount: "",
    fuelCost: "",
    pluginAmount: "",
    energyTariff: "14",
  })

  useEffect(() => {
    if (editEntry) {
      setFormData({
        date: editEntry.date,
        hevOdo: editEntry.hevOdo?.toString() || "",
        evOdo: editEntry.evOdo?.toString() || "",
        odo: editEntry.odo.toString(),
        fuelAmount: editEntry.fuelAmount.toString(),
        fuelCost: editEntry.fuelCost.toString(),
        pluginAmount: editEntry.pluginAmount.toString(),
        energyTariff: editEntry.energyTariff.toString(),
      })
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        hevOdo: "",
        evOdo: "",
        odo: "",
        fuelAmount: "",
        fuelCost: "",
        pluginAmount: "",
        energyTariff: "14",
      })
    }
  }, [editEntry, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      energyTariff: "14",
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            {editEntry && onNavigatePrevious && (
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
            <DialogTitle className="flex-1">{editEntry ? "Edit Mileage Entry" : "Add Mileage Entry"}</DialogTitle>
            {editEntry && onNavigateNext && (
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
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hevOdo">HEV ODO (km)</Label>
            <Input
              id="hevOdo"
              type="number"
              step="0.1"
              value={formData.hevOdo}
              onChange={(e) => handleChange("hevOdo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evOdo">EV ODO (km)</Label>
            <Input
              id="evOdo"
              type="number"
              step="0.1"
              value={formData.evOdo}
              onChange={(e) => handleChange("evOdo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="odo">
              ODO (km) <span className="text-destructive">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="fuelAmount">
              Fuel Amount (liters) <span className="text-destructive">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="fuelCost">
              Fuel Cost (₱) <span className="text-destructive">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="pluginAmount">
              Plug-in Amount (kWh) <span className="text-destructive">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="energyTariff">
              Energy Tariff (₱/kWh) <span className="text-destructive">*</span>
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
