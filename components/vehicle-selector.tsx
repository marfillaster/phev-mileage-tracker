"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Vehicle } from "@/lib/vehicle-storage"

interface VehicleSelectorProps {
  vehicles: Vehicle[]
  currentVehicleId: string
  onSelectVehicle: (vehicleId: string) => void
  onAddVehicle: (name: string) => void
  onRenameVehicle: (vehicleId: string, newName: string) => void
}

export function VehicleSelector({
  vehicles,
  currentVehicleId,
  onSelectVehicle,
  onAddVehicle,
  onRenameVehicle,
}: VehicleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [showNewVehicleDialog, setShowNewVehicleDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newVehicleName, setNewVehicleName] = useState("")
  const [renameValue, setRenameValue] = useState("")

  const currentVehicle = vehicles.find((v) => v.id === currentVehicleId)

  const handleAddVehicle = () => {
    if (newVehicleName.trim()) {
      onAddVehicle(newVehicleName.trim())
      setNewVehicleName("")
      setShowNewVehicleDialog(false)
    }
  }

  const handleRename = () => {
    if (renameValue.trim()) {
      onRenameVehicle(currentVehicleId, renameValue.trim())
      setRenameValue("")
      setShowRenameDialog(false)
    }
  }

  const openRenameDialog = () => {
    setRenameValue(currentVehicle?.name || "")
    setShowRenameDialog(true)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between bg-transparent"
          >
            <span className="truncate">{currentVehicle?.name || "Select vehicle..."}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search vehicle..." />
            <CommandList>
              <CommandEmpty>No vehicle found.</CommandEmpty>
              <CommandGroup>
                {vehicles.map((vehicle) => (
                  <CommandItem
                    key={vehicle.id}
                    value={vehicle.name}
                    onSelect={() => {
                      onSelectVehicle(vehicle.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", currentVehicleId === vehicle.id ? "opacity-100" : "opacity-0")}
                    />
                    {vehicle.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    openRenameDialog()
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename vehicle
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewVehicleDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new vehicle
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewVehicleDialog} onOpenChange={setShowNewVehicleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Enter a name for your new vehicle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle-name">Vehicle Name</Label>
              <Input
                id="vehicle-name"
                value={newVehicleName}
                onChange={(e) => setNewVehicleName(e.target.value)}
                placeholder="e.g., My PHEV"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddVehicle()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVehicleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} disabled={!newVehicleName.trim()}>
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Vehicle</DialogTitle>
            <DialogDescription>Enter a new name for your vehicle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-vehicle">Vehicle Name</Label>
              <Input
                id="rename-vehicle"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="e.g., My PHEV"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
