"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/vehicle-selector"
import type { Vehicle } from "@/lib/vehicle-storage"

interface AppToolbarProps {
  vehicles: Vehicle[]
  currentVehicleId: string
  onSelectVehicle: (vehicleId: string) => void
  onAddVehicle: (name: string) => void
  onRenameVehicle: (vehicleId: string, newName: string) => void
  onMenuClick: () => void
}

export function AppToolbar({
  vehicles,
  currentVehicleId,
  onSelectVehicle,
  onAddVehicle,
  onRenameVehicle,
  onMenuClick,
}: AppToolbarProps) {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-7xl">
        <VehicleSelector
          vehicles={vehicles}
          currentVehicleId={currentVehicleId}
          onSelectVehicle={onSelectVehicle}
          onAddVehicle={onAddVehicle}
          onRenameVehicle={onRenameVehicle}
        />
        <Button variant="outline" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
