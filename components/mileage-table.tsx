"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Pencil, Zap, Fuel, DollarSign, Gauge, Info } from "lucide-react"
import type { MileageEntry } from "@/app/page"

interface MileageTableProps {
  entries: MileageEntry[]
  onDelete: (id: string) => void
  onEdit: (entry: MileageEntry) => void
}

export function MileageTable({ entries, onDelete, onEdit }: MileageTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [showDistancePerDay, setShowDistancePerDay] = useState(false)
  const [costView, setCostView] = useState<"total" | "perKm" | "perDay">("total")
  const [efficiencyUnit, setEfficiencyUnit] = useState<"kmPer" | "per100">("kmPer")

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries])

  const calculateValues = (entry: MileageEntry, prevEntry: MileageEntry | null) => {
    if (!prevEntry) {
      return {
        distance: 0,
        hevDistance: 0,
        evDistance: 0,
        energy: 0,
        energyCost: 0,
        totalCost: entry.fuelCost,
        daysSinceRefuel: 0,
        costPerKm: 0,
        evCostPerKm: 0,
        hevCostPerKm: 0,
        costPerDay: 0,
        evCostPerDay: 0,
        hevCostPerDay: 0,
        costPerLiter: 0,
        kmPerLiter: 0,
        evKmPerKwh: 0,
        evEquivalentKmPerLiter: 0,
        hevKmPerLiter: 0,
        distancePerDay: 0,
        evDistancePerDay: 0,
        hevDistancePerDay: 0,
        litersPer100km: 0,
        whPerKm: 0,
        kwhPer100km: 0,
        evWhPerKm: 0,
        evKwhPer100km: 0,
        hevLitersPer100km: 0,
        evEquivalentLitersPer100km: 0,
      }
    }

    const distance = entry.odo - prevEntry.odo
    const hevDistance = entry.hevOdo && prevEntry.hevOdo ? entry.hevOdo - prevEntry.hevOdo : 0
    const evDistance = entry.evOdo && prevEntry.evOdo ? entry.evOdo - prevEntry.evOdo : 0
    const energy = entry.pluginAmount - prevEntry.pluginAmount
    const energyCost = energy * entry.energyTariff
    const totalCost = entry.fuelCost + energyCost

    const daysSinceRefuel = Math.round(
      (new Date(entry.date).getTime() - new Date(prevEntry.date).getTime()) / (1000 * 60 * 60 * 24),
    )

    const costPerKm = distance > 0 ? totalCost / distance : 0
    const evCostPerKm = evDistance > 0 ? energyCost / evDistance : 0
    const hevCostPerKm = hevDistance > 0 ? entry.fuelCost / hevDistance : 0

    const costPerDay = daysSinceRefuel > 0 ? totalCost / daysSinceRefuel : 0
    const evCostPerDay = daysSinceRefuel > 0 ? energyCost / daysSinceRefuel : 0
    const hevCostPerDay = daysSinceRefuel > 0 ? entry.fuelCost / daysSinceRefuel : 0

    const distancePerDay = daysSinceRefuel > 0 ? distance / daysSinceRefuel : 0
    const evDistancePerDay = daysSinceRefuel > 0 ? evDistance / daysSinceRefuel : 0
    const hevDistancePerDay = daysSinceRefuel > 0 ? hevDistance / daysSinceRefuel : 0

    const costPerLiter = entry.fuelAmount > 0 ? entry.fuelCost / entry.fuelAmount : 0
    const energyEquivalentLiters = costPerLiter > 0 ? energyCost / costPerLiter : 0
    const totalEquivalentLiters = entry.fuelAmount + energyEquivalentLiters
    const kmPerLiter = totalEquivalentLiters > 0 && distance > 0 ? distance / totalEquivalentLiters : 0

    const evKmPerKwh = energy > 0 && evDistance > 0 ? evDistance / energy : 0
    const evEquivalentKmPerLiter = costPerLiter > 0 && evDistance > 0 ? evDistance / (energyCost / costPerLiter) : 0
    const hevKmPerLiter = entry.fuelAmount > 0 && hevDistance > 0 ? hevDistance / entry.fuelAmount : 0

    const litersPer100km = distance > 0 && kmPerLiter > 0 ? 100 / kmPerLiter : 0
    const whPerKm = energy > 0 && distance > 0 ? (energy * 1000) / distance : 0
    const kwhPer100km = distance > 0 && energy > 0 ? (energy * 100) / distance : 0
    const evWhPerKm = energy > 0 && evDistance > 0 ? (energy * 1000) / evDistance : 0
    const evKwhPer100km = energy > 0 && evDistance > 0 ? (energy * 100) / evDistance : 0
    const hevLitersPer100km = hevDistance > 0 && hevKmPerLiter > 0 ? 100 / hevKmPerLiter : 0
    const evEquivalentLitersPer100km = evEquivalentKmPerLiter > 0 ? 100 / evEquivalentKmPerLiter : 0

    return {
      distance,
      hevDistance,
      evDistance,
      energy,
      energyCost,
      totalCost,
      daysSinceRefuel,
      costPerKm,
      evCostPerKm,
      hevCostPerKm,
      costPerDay,
      evCostPerDay,
      hevCostPerDay,
      costPerLiter,
      kmPerLiter,
      evKmPerKwh,
      evEquivalentKmPerLiter,
      hevKmPerLiter,
      distancePerDay,
      evDistancePerDay,
      hevDistancePerDay,
      litersPer100km,
      whPerKm,
      kwhPer100km,
      evWhPerKm,
      evKwhPer100km,
      hevLitersPer100km,
      evEquivalentLitersPer100km,
    }
  }

  return (
    <>
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">ODO (km)</TableHead>
                <TableHead
                  className="text-right cursor-pointer select-none"
                  onClick={() => setShowDistancePerDay(!showDistancePerDay)}
                >
                  <div className="flex items-center gap-2">
                    Distance (km)
                    <Popover
                      open={openPopover === "distance"}
                      onOpenChange={(open) => setOpenPopover(open ? "distance" : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Distance formula</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm" align="end">
                        <div className="space-y-1">
                          <p className="font-semibold">Distance:</p>
                          <p>Current ODO - Previous ODO</p>
                          {showDistancePerDay && (
                            <>
                              <p className="font-semibold mt-2">Distance per day:</p>
                              <p>Distance / Days since refuel</p>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-1">
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${!showDistancePerDay ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                      />
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${showDistancePerDay ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                      />
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-right">Fuel (L)</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Energy
                    <Popover
                      open={openPopover === "energy"}
                      onOpenChange={(open) => setOpenPopover(open ? "energy" : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Energy formula</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm" align="end">
                        <div className="space-y-1">
                          <p className="font-semibold">Energy Consumed:</p>
                          <p>Current Plug-in - Previous Plug-in</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer select-none"
                  onClick={() => {
                    const views: Array<"total" | "perKm" | "perDay"> = ["total", "perKm", "perDay"]
                    const currentIndex = views.indexOf(costView)
                    setCostView(views[(currentIndex + 1) % views.length])
                  }}
                >
                  <div className="flex items-center justify-end gap-2">
                    Cost (₱){costView === "perKm" && "/km"}
                    {costView === "perDay" && "/day"}
                    <Popover
                      open={openPopover === "cost"}
                      onOpenChange={(open) => setOpenPopover(open ? "cost" : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Cost formula</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm" align="end">
                        <div className="space-y-1.5">
                          <p className="font-semibold">Cost Metrics:</p>
                          <div>
                            <p className="text-xs font-medium">Total Cost:</p>
                            <p>Fuel Cost + Energy Cost</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Cost per Kilometer (₱/km):</p>
                            <p className="text-xs">Combined: Total Cost ÷ Distance</p>
                            <p className="text-xs">EV: Energy Cost ÷ EV Distance</p>
                            <p className="text-xs">HEV: Fuel Cost ÷ HEV Distance</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium">Cost per Day (₱/day):</p>
                            <p className="text-xs">Combined: Total Cost ÷ Days</p>
                            <p className="text-xs">EV: Energy Cost ÷ Days</p>
                            <p className="text-xs">HEV: Fuel Cost ÷ Days</p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex gap-1">
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${costView === "total" ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                      />
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${costView === "perKm" ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                      />
                      <div
                        className={`h-1.5 w-1.5 rounded-full border ${costView === "perDay" ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                      />
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEfficiencyUnit(efficiencyUnit === "kmPer" ? "per100" : "kmPer")}
                      className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                    >
                      Efficiency
                      <div className="flex gap-0.5">
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
                      </div>
                    </button>
                    <Popover
                      open={openPopover === "efficiency"}
                      onOpenChange={(open) => setOpenPopover(open ? "efficiency" : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Efficiency formula</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto text-sm" align="end">
                        <div className="space-y-1.5">
                          <p className="font-semibold">Efficiency Metrics:</p>
                          {efficiencyUnit === "kmPer" ? (
                            <>
                              <div>
                                <p className="text-xs font-medium">Combined km/L:</p>
                                <p className="text-xs">Distance ÷ (Fuel + Energy Cost/Fuel Price per L)</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV Wh/km:</p>
                                <p className="text-xs">Energy (Wh) ÷ EV Distance</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV as km/L*:</p>
                                <p className="text-xs">Cost-equivalent: EV distance if energy was fuel</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">HEV km/L:</p>
                                <p className="text-xs">HEV Distance ÷ Fuel Amount</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs font-medium">Combined L/100km:</p>
                                <p className="text-xs">100 ÷ Combined km/L</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV kWh/100km:</p>
                                <p className="text-xs">Energy × 100 ÷ EV Distance</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">EV as L/100km*:</p>
                                <p className="text-xs">100 ÷ EV km/L*</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">HEV L/100km:</p>
                                <p className="text-xs">100 ÷ HEV km/L</p>
                              </div>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry, index) => {
                const prevEntry = sortedEntries[index + 1] || null
                const calculated = calculateValues(entry, prevEntry)

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium align-top">
                      <p>
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {calculated.daysSinceRefuel > 0 && (
                        <p className="text-sm text-muted-foreground">{calculated.daysSinceRefuel} days</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="text-right flex items-center justify-end gap-1">
                        <Gauge className="h-3 w-3 text-orange-500" />
                        {entry.odo.toFixed(1)}
                      </p>
                      {entry.evOdo && (
                        <p className="text-sm text-muted-foreground text-right">EV {entry.evOdo.toFixed(1)}</p>
                      )}
                      {entry.hevOdo && (
                        <p className="text-sm text-muted-foreground text-right">HEV {entry.hevOdo.toFixed(1)}</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="text-right">
                        {showDistancePerDay
                          ? calculated.distancePerDay > 0
                            ? calculated.distancePerDay.toFixed(1)
                            : "-"
                          : calculated.distance > 0
                            ? calculated.distance.toFixed(1)
                            : "-"}
                      </p>
                      {showDistancePerDay ? (
                        <>
                          {calculated.evDistancePerDay > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evDistancePerDay.toFixed(1)}
                            </p>
                          )}
                          {calculated.hevDistancePerDay > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevDistancePerDay.toFixed(1)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          {calculated.evDistance > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evDistance.toFixed(1)}
                            </p>
                          )}
                          {calculated.hevDistance > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevDistance.toFixed(1)}
                            </p>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="text-right">{entry.fuelAmount.toFixed(2)}</p>
                      {calculated.costPerLiter > 0 && (
                        <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          {calculated.costPerLiter.toFixed(2)}/L
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                        <Gauge className="h-3 w-3 text-green-500" />
                        {entry.pluginAmount.toFixed(2)} kWh
                      </p>
                      <p className="text-sm text-right">
                        {calculated.energy > 0 ? `${calculated.energy.toFixed(2)} kWh` : "-"}
                      </p>
                      {calculated.energy > 0 && (
                        <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          {entry.energyTariff.toFixed(2)}/kWh
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {costView === "total" ? (
                        <>
                          <p className="text-right">{calculated.totalCost.toFixed(2)}</p>
                          {calculated.energyCost > 0 && (
                            <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                              <Zap className="h-3 w-3" />
                              {calculated.energyCost.toFixed(2)}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                            <Fuel className="h-3 w-3" />
                            {entry.fuelCost.toFixed(2)}
                          </p>
                        </>
                      ) : costView === "perKm" ? (
                        <>
                          <p className="text-right">
                            {calculated.costPerKm > 0 ? calculated.costPerKm.toFixed(2) : "-"}
                          </p>
                          {calculated.evCostPerKm > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evCostPerKm.toFixed(2)}
                            </p>
                          )}
                          {calculated.hevCostPerKm > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevCostPerKm.toFixed(2)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-right">
                            {calculated.costPerDay > 0 ? calculated.costPerDay.toFixed(2) : "-"}
                          </p>
                          {calculated.evCostPerDay > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evCostPerDay.toFixed(2)}
                            </p>
                          )}
                          {calculated.hevCostPerDay > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevCostPerDay.toFixed(2)}
                            </p>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {efficiencyUnit === "kmPer" ? (
                        <>
                          <p className="text-right">
                            {calculated.kmPerLiter > 0 ? `${calculated.kmPerLiter.toFixed(2)} km/L` : "-"}
                          </p>
                          {calculated.evWhPerKm > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evWhPerKm.toFixed(0)} Wh/km
                            </p>
                          )}
                          {calculated.evEquivalentKmPerLiter > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evEquivalentKmPerLiter.toFixed(2)} km/L*
                            </p>
                          )}
                          {calculated.hevKmPerLiter > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevKmPerLiter.toFixed(2)} km/L
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-right">
                            {calculated.litersPer100km > 0 ? `${calculated.litersPer100km.toFixed(2)} L/100km` : "-"}
                          </p>
                          {calculated.evKwhPer100km > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evKwhPer100km.toFixed(2)} kWh/100km
                            </p>
                          )}
                          {calculated.evEquivalentLitersPer100km > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              EV {calculated.evEquivalentLitersPer100km.toFixed(2)} L/100km*
                            </p>
                          )}
                          {calculated.hevLitersPer100km > 0 && (
                            <p className="text-sm text-muted-foreground text-right">
                              HEV {calculated.hevLitersPer100km.toFixed(2)} L/100km
                            </p>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit entry</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete entry</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedEntries.map((entry, index) => {
          const prevEntry = sortedEntries[index + 1] || null
          const calculated = calculateValues(entry, prevEntry)

          return (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-lg">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    {calculated.daysSinceRefuel > 0 && (
                      <div className="text-sm text-muted-foreground">{calculated.daysSinceRefuel} days ago</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit entry</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete entry</span>
                    </Button>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                  <dt className="text-muted-foreground flex items-start justify-between">
                    <span>{showDistancePerDay ? "Distance/day" : "Distance"}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowDistancePerDay(!showDistancePerDay)}
                        className="flex items-center gap-1 p-1"
                      >
                        <div className="flex gap-0.5">
                          <div
                            className={`h-1.5 w-1.5 rounded-full border ${
                              !showDistancePerDay
                                ? "bg-primary border-primary"
                                : "bg-background border-muted-foreground"
                            }`}
                          />
                          <div
                            className={`h-1.5 w-1.5 rounded-full border ${
                              showDistancePerDay ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                            }`}
                          />
                        </div>
                      </button>
                      <Popover
                        open={openPopover === `distance-${entry.id}`}
                        onOpenChange={(open) => setOpenPopover(open ? `distance-${entry.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                            <Info className="h-3.5 w-3.5" />
                            <span className="sr-only">Distance formula</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto text-sm" align="end">
                          <div className="space-y-1">
                            <p className="font-semibold">Distance:</p>
                            <p>Current ODO - Previous ODO</p>
                            {showDistancePerDay && (
                              <>
                                <p className="font-semibold mt-2">Distance per day:</p>
                                <p>Distance / Days since refuel</p>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </dt>
                  <dd className="text-right font-medium">
                    {showDistancePerDay
                      ? calculated.distancePerDay > 0
                        ? `${calculated.distancePerDay.toFixed(1)} km/d`
                        : "-"
                      : calculated.distance > 0
                        ? `${calculated.distance.toFixed(1)} km`
                        : "-"}
                  </dd>
                  {showDistancePerDay ? (
                    <>
                      {calculated.evDistancePerDay > 0 && (
                        <>
                          <dt className="text-muted-foreground pl-4 align-top">EV</dt>
                          <dd className="text-right align-top">{calculated.evDistancePerDay.toFixed(1)} km/d</dd>
                        </>
                      )}
                      {calculated.hevDistancePerDay > 0 && (
                        <>
                          <dt className="text-muted-foreground pl-4 align-top">HEV</dt>
                          <dd className="text-right align-top">{calculated.hevDistancePerDay.toFixed(1)} km/d</dd>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {calculated.evDistance > 0 && (
                        <>
                          <dt className="text-muted-foreground pl-4 align-top">EV</dt>
                          <dd className="text-right align-top">{calculated.evDistance.toFixed(1)} km</dd>
                        </>
                      )}
                      {calculated.hevDistance > 0 && (
                        <>
                          <dt className="text-muted-foreground pl-4 align-top">HEV</dt>
                          <dd className="text-right align-top">{calculated.hevDistance.toFixed(1)} km</dd>
                        </>
                      )}
                    </>
                  )}

                  <dt className="text-muted-foreground align-top">ODO</dt>
                  <dd className="text-right font-medium flex items-center justify-end gap-1 align-top">
                    <Gauge className="h-3 w-3 text-orange-500" />
                    {entry.odo.toFixed(1)} km
                  </dd>

                  {entry.evOdo && (
                    <>
                      <dt className="text-muted-foreground align-top">EV ODO</dt>
                      <dd className="text-right align-top">{entry.evOdo.toFixed(1)} km</dd>
                    </>
                  )}

                  {entry.hevOdo && (
                    <>
                      <dt className="text-muted-foreground align-top">HEV ODO</dt>
                      <dd className="text-right align-top">{entry.hevOdo.toFixed(1)} km</dd>
                    </>
                  )}

                  <dt className="text-muted-foreground align-top">Fuel</dt>
                  <dd className="text-right align-top">{entry.fuelAmount.toFixed(2)} L</dd>

                  <dt className="text-muted-foreground align-top">Fuel Cost</dt>
                  <dd className="text-right align-top">₱{entry.fuelCost.toFixed(2)}</dd>

                  {calculated.costPerLiter > 0 && (
                    <>
                      <dt className="text-muted-foreground flex items-center gap-1 align-top">
                        <DollarSign className="h-3 w-3" />
                        Cost/L
                      </dt>
                      <dd className="text-right align-top">₱{calculated.costPerLiter.toFixed(2)}</dd>
                    </>
                  )}

                  <dt className="text-muted-foreground flex items-center gap-1 align-top">
                    <Gauge className="h-3 w-3 text-green-500" />
                    Plug-in
                  </dt>
                  <dd className="text-right align-top">{entry.pluginAmount.toFixed(2)} kWh</dd>

                  {calculated.energy > 0 && (
                    <>
                      <dt className="text-muted-foreground align-top">Energy Used</dt>
                      <dd className="text-right align-top">{calculated.energy.toFixed(2)} kWh</dd>
                    </>
                  )}

                  <dt className="text-muted-foreground flex items-center gap-1 align-top">
                    <DollarSign className="h-3 w-3" />
                    Tariff
                  </dt>
                  <dd className="text-right align-top">₱{entry.energyTariff.toFixed(2)}/kWh</dd>

                  {calculated.energyCost > 0 && (
                    <>
                      <dt className="text-muted-foreground flex items-center gap-1 align-top">
                        <Zap className="h-3 w-3" />
                        Energy Cost
                      </dt>
                      <dd className="text-right align-top">₱{calculated.energyCost.toFixed(2)}</dd>
                    </>
                  )}

                  <dt className="text-muted-foreground font-medium align-top">Total Cost</dt>
                  <dd className="text-right font-medium align-top">₱{calculated.totalCost.toFixed(2)}</dd>

                  <dt className="text-muted-foreground flex items-start justify-between">
                    <span>Cost</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (costView === "total") setCostView("perKm")
                          else if (costView === "perKm") setCostView("perDay")
                          else setCostView("total")
                        }}
                        className="flex items-center gap-1 p-1"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full border ${
                            costView === "total" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                          }`}
                        />
                        <div
                          className={`w-1.5 h-1.5 rounded-full border ${
                            costView === "perKm" ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                          }`}
                        />
                        <div
                          className={`w-1.5 h-1.5 rounded-full border ${
                            costView === "perDay"
                              ? "bg-primary border-primary"
                              : "bg-background border-muted-foreground"
                          }`}
                        />
                      </button>
                      <Popover
                        open={openPopover === `cost-${entry.id}`}
                        onOpenChange={(open) => setOpenPopover(open ? `cost-${entry.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                            <Info className="h-3.5 w-3.5" />
                            <span className="sr-only">Cost formula</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto text-sm" align="end">
                          <div className="space-y-1.5">
                            <p className="font-semibold">Cost Metrics:</p>
                            <div>
                              <p className="text-xs font-medium">Total Cost:</p>
                              <p>Fuel Cost + Energy Cost</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium">Cost per Kilometer (₱/km):</p>
                              <p className="text-xs">Combined: Total Cost ÷ Distance</p>
                              <p className="text-xs">EV: Energy Cost ÷ EV Distance</p>
                              <p className="text-xs">HEV: Fuel Cost ÷ HEV Distance</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium">Cost per Day (₱/day):</p>
                              <p className="text-xs">Combined: Total Cost ÷ Days</p>
                              <p className="text-xs">EV: Energy Cost ÷ Days</p>
                              <p className="text-xs">HEV: Fuel Cost ÷ Days</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </dt>
                  {costView === "total" ? (
                    <dd className="text-right align-top">
                      <p>₱{calculated.totalCost.toFixed(2)}</p>
                      {calculated.energyCost > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                          <Zap className="h-3 w-3" />
                          {calculated.energyCost.toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <Fuel className="h-3 w-3" />
                        {entry.fuelCost.toFixed(2)}
                      </p>
                    </dd>
                  ) : costView === "perKm" ? (
                    <dd className="text-right align-top">
                      <p>₱{calculated.costPerKm > 0 ? calculated.costPerKm.toFixed(2) : "-"}/km</p>
                      {calculated.evCostPerKm > 0 && (
                        <p className="text-sm text-muted-foreground">EV: ₱{calculated.evCostPerKm.toFixed(2)}/km</p>
                      )}
                      {calculated.hevCostPerKm > 0 && (
                        <p className="text-sm text-muted-foreground">HEV: ₱{calculated.hevCostPerKm.toFixed(2)}/km</p>
                      )}
                    </dd>
                  ) : (
                    <dd className="text-right align-top">
                      <p>₱{calculated.costPerDay > 0 ? calculated.costPerDay.toFixed(2) : "-"}/day</p>
                      {calculated.evCostPerDay > 0 && (
                        <p className="text-sm text-muted-foreground">EV: ₱{calculated.evCostPerDay.toFixed(2)}/day</p>
                      )}
                      {calculated.hevCostPerDay > 0 && (
                        <p className="text-sm text-muted-foreground">HEV: ₱{calculated.hevCostPerDay.toFixed(2)}/day</p>
                      )}
                    </dd>
                  )}

                  <dt className="text-muted-foreground flex items-start justify-between">
                    <span>Efficiency</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEfficiencyUnit(efficiencyUnit === "kmPer" ? "per100" : "kmPer")}
                        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity p-1"
                      >
                        <div className="flex gap-0.5">
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
                        </div>
                      </button>
                      <Popover
                        open={openPopover === `efficiency-${entry.id}`}
                        onOpenChange={(open) => setOpenPopover(open ? `efficiency-${entry.id}` : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                            <Info className="h-3.5 w-3.5" />
                            <span className="sr-only">Efficiency formula</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto text-sm" align="end">
                          <div className="space-y-1.5">
                            <p className="font-semibold">Efficiency Metrics:</p>
                            {efficiencyUnit === "kmPer" ? (
                              <>
                                <div>
                                  <p className="text-xs font-medium">Combined km/L:</p>
                                  <p className="text-xs">Distance ÷ (Fuel + Energy Cost/Fuel Price per L)</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">EV Wh/km:</p>
                                  <p className="text-xs">Energy (Wh) ÷ EV Distance</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">EV as km/L*:</p>
                                  <p className="text-xs">Cost-equivalent: EV distance if energy was fuel</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">HEV km/L:</p>
                                  <p className="text-xs">HEV Distance ÷ Fuel Amount</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-xs font-medium">Combined L/100km:</p>
                                  <p className="text-xs">100 ÷ Combined km/L</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">EV kWh/100km:</p>
                                  <p className="text-xs">Energy × 100 ÷ EV Distance</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">EV as L/100km*:</p>
                                  <p className="text-xs">100 ÷ EV km/L*</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">HEV L/100km:</p>
                                  <p className="text-xs">100 ÷ HEV km/L</p>
                                </div>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </dt>
                  <dd className="text-sm space-y-1 col-span-2 align-top">
                    {efficiencyUnit === "kmPer" ? (
                      <>
                        <div>{calculated.kmPerLiter > 0 ? `${calculated.kmPerLiter.toFixed(2)} km/L` : "-"}</div>
                        {calculated.evWhPerKm > 0 && (
                          <div className="text-muted-foreground">EV {calculated.evWhPerKm.toFixed(0)} Wh/km</div>
                        )}
                        {calculated.evEquivalentKmPerLiter > 0 && (
                          <div className="text-muted-foreground">
                            EV {calculated.evEquivalentKmPerLiter.toFixed(2)} km/L*
                          </div>
                        )}
                        {calculated.hevKmPerLiter > 0 && (
                          <div className="text-muted-foreground">HEV {calculated.hevKmPerLiter.toFixed(2)} km/L</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          {calculated.litersPer100km > 0 ? `${calculated.litersPer100km.toFixed(2)} L/100km` : "-"}
                        </div>
                        {calculated.evKwhPer100km > 0 && (
                          <div className="text-muted-foreground">
                            EV {calculated.evKwhPer100km.toFixed(2)} kWh/100km
                          </div>
                        )}
                        {calculated.evEquivalentLitersPer100km > 0 && (
                          <div className="text-muted-foreground">
                            EV {calculated.evEquivalentLitersPer100km.toFixed(2)} L/100km*
                          </div>
                        )}
                        {calculated.hevLitersPer100km > 0 && (
                          <div className="text-muted-foreground">
                            HEV {calculated.hevLitersPer100km.toFixed(2)} L/100km
                          </div>
                        )}
                      </>
                    )}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function generateCSV(entries: MileageEntry[]): string {
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const calculateValues = (entry: MileageEntry, prevEntry: MileageEntry | null) => {
    if (!prevEntry) {
      return {
        distance: 0,
        hevDistance: 0,
        evDistance: 0,
        energy: 0,
        energyCost: 0,
        totalCost: entry.fuelCost,
        daysSinceRefuel: 0,
        costPerKm: 0,
        evCostPerKm: 0,
        hevCostPerKm: 0,
        costPerDay: 0,
        evCostPerDay: 0,
        hevCostPerDay: 0,
        costPerLiter: 0,
        kmPerLiter: 0,
        evKmPerKwh: 0,
        evEquivalentKmPerLiter: 0,
        hevKmPerLiter: 0,
        distancePerDay: 0,
        evDistancePerDay: 0,
        hevDistancePerDay: 0,
        litersPer100km: 0,
        whPerKm: 0,
        kwhPer100km: 0,
        evWhPerKm: 0,
        evKwhPer100km: 0,
        hevLitersPer100km: 0,
        evEquivalentLitersPer100km: 0,
      }
    }

    const distance = entry.odo - prevEntry.odo
    const hevDistance = entry.hevOdo && prevEntry.hevOdo ? entry.hevOdo - prevEntry.hevOdo : 0
    const evDistance = entry.evOdo && prevEntry.evOdo ? entry.evOdo - prevEntry.evOdo : 0
    const energy = entry.pluginAmount - prevEntry.pluginAmount
    const energyCost = energy * entry.energyTariff
    const totalCost = entry.fuelCost + energyCost

    const daysSinceRefuel = Math.round(
      (new Date(entry.date).getTime() - new Date(prevEntry.date).getTime()) / (1000 * 60 * 60 * 24),
    )

    const costPerKm = distance > 0 ? totalCost / distance : 0
    const evCostPerKm = evDistance > 0 ? energyCost / evDistance : 0
    const hevCostPerKm = hevDistance > 0 ? entry.fuelCost / hevDistance : 0
    const costPerDay = daysSinceRefuel > 0 ? totalCost / daysSinceRefuel : 0
    const evCostPerDay = daysSinceRefuel > 0 ? energyCost / daysSinceRefuel : 0
    const hevCostPerDay = daysSinceRefuel > 0 ? entry.fuelCost / daysSinceRefuel : 0

    const distancePerDay = daysSinceRefuel > 0 ? distance / daysSinceRefuel : 0
    const evDistancePerDay = daysSinceRefuel > 0 ? evDistance / daysSinceRefuel : 0
    const hevDistancePerDay = daysSinceRefuel > 0 ? hevDistance / daysSinceRefuel : 0

    const costPerLiter = entry.fuelAmount > 0 ? entry.fuelCost / entry.fuelAmount : 0
    const energyEquivalentLiters = costPerLiter > 0 ? energyCost / costPerLiter : 0
    const totalEquivalentLiters = entry.fuelAmount + energyEquivalentLiters
    const kmPerLiter = totalEquivalentLiters > 0 && distance > 0 ? distance / totalEquivalentLiters : 0

    const evKmPerKwh = energy > 0 && evDistance > 0 ? evDistance / energy : 0
    const evEquivalentKmPerLiter = costPerLiter > 0 && evDistance > 0 ? evDistance / (energyCost / costPerLiter) : 0
    const hevKmPerLiter = entry.fuelAmount > 0 && hevDistance > 0 ? hevDistance / entry.fuelAmount : 0

    const litersPer100km = distance > 0 && kmPerLiter > 0 ? 100 / kmPerLiter : 0
    const whPerKm = energy > 0 && distance > 0 ? (energy * 1000) / distance : 0
    const kwhPer100km = distance > 0 && energy > 0 ? (energy * 100) / distance : 0
    const evWhPerKm = energy > 0 && evDistance > 0 ? (energy * 1000) / evDistance : 0
    const evKwhPer100km = energy > 0 && evDistance > 0 ? (energy * 100) / evDistance : 0
    const hevLitersPer100km = hevDistance > 0 && hevKmPerLiter > 0 ? 100 / hevKmPerLiter : 0
    const evEquivalentLitersPer100km = evEquivalentKmPerLiter > 0 ? 100 / evEquivalentKmPerLiter : 0

    return {
      distance,
      hevDistance,
      evDistance,
      energy,
      energyCost,
      totalCost,
      daysSinceRefuel,
      costPerKm,
      evCostPerKm,
      hevCostPerKm,
      costPerDay,
      evCostPerDay,
      hevCostPerDay,
      costPerLiter,
      kmPerLiter,
      evKmPerKwh,
      evEquivalentKmPerLiter,
      hevKmPerLiter,
      distancePerDay,
      evDistancePerDay,
      hevDistancePerDay,
      litersPer100km,
      whPerKm,
      kwhPer100km,
      evWhPerKm,
      evKwhPer100km,
      hevLitersPer100km,
      evEquivalentLitersPer100km,
    }
  }

  const headers = [
    "Date",
    "ODO (km)",
    "EV ODO (km)",
    "HEV ODO (km)",
    "Distance (km)",
    "EV Distance (km)",
    "HEV Distance (km)",
    "Days Since Refuel",
    "Fuel Amount (L)",
    "Fuel Cost (₱)",
    "Cost per Liter (₱/L)",
    "Plug-in Amount (kWh)",
    "Energy Used (kWh)",
    "Energy Tariff (₱/kWh)",
    "Energy Cost (₱)",
    "Total Cost (₱)",
    "Cost per Day (₱/day)",
    "EV Cost per Day (₱/day)",
    "HEV Cost per Day (₱/day)",
    "Cost per km (₱/km)",
    "EV Cost per km (₱/km)",
    "HEV Cost per km (₱/km)",
    "Combined km/L",
    "Combined L/100km",
    "EV Wh/km",
    "EV kWh/100km",
    "EV km/L equivalent",
    "EV L/100km equivalent*",
    "HEV km/L",
    "HEV L/100km",
    "Distance/day (km/d)",
    "EV Distance/day (km/d)",
    "HEV Distance/day (km/d)",
  ]

  const rows = sortedEntries.map((entry, index) => {
    const prevEntry = sortedEntries[index + 1] || null
    const calc = calculateValues(entry, prevEntry)

    return [
      entry.date,
      entry.odo.toFixed(1),
      entry.evOdo?.toFixed(1) || "",
      entry.hevOdo?.toFixed(1) || "",
      calc.distance > 0 ? calc.distance.toFixed(1) : "",
      calc.evDistance > 0 ? calc.evDistance.toFixed(1) : "",
      calc.hevDistance > 0 ? calc.hevDistance.toFixed(1) : "",
      calc.daysSinceRefuel > 0 ? calc.daysSinceRefuel.toString() : "",
      entry.fuelAmount.toFixed(2),
      entry.fuelCost.toFixed(2),
      calc.costPerLiter > 0 ? calc.costPerLiter.toFixed(2) : "",
      entry.pluginAmount.toFixed(2),
      calc.energy > 0 ? calc.energy.toFixed(2) : "",
      entry.energyTariff.toFixed(2),
      calc.energyCost > 0 ? calc.energyCost.toFixed(2) : "",
      calc.totalCost.toFixed(2),
      calc.costPerDay > 0 ? calc.costPerDay.toFixed(2) : "",
      calc.evCostPerDay > 0 ? calc.evCostPerDay.toFixed(2) : "",
      calc.hevCostPerDay > 0 ? calc.hevCostPerDay.toFixed(2) : "",
      calc.costPerKm > 0 ? calc.costPerKm.toFixed(2) : "",
      calc.evCostPerKm > 0 ? calc.evCostPerKm.toFixed(2) : "",
      calc.hevCostPerKm > 0 ? calc.hevCostPerKm.toFixed(2) : "",
      calc.kmPerLiter > 0 ? calc.kmPerLiter.toFixed(2) : "",
      calc.litersPer100km > 0 ? calc.litersPer100km.toFixed(2) : "",
      calc.evWhPerKm > 0 ? calc.evWhPerKm.toFixed(0) : "",
      calc.evKwhPer100km > 0 ? calc.evKwhPer100km.toFixed(2) : "",
      calc.evEquivalentKmPerLiter > 0 ? calc.evEquivalentKmPerLiter.toFixed(2) : "",
      calc.evEquivalentLitersPer100km > 0 ? calc.evEquivalentLitersPer100km.toFixed(2) : "",
      calc.hevKmPerLiter > 0 ? calc.hevKmPerLiter.toFixed(2) : "",
      calc.hevLitersPer100km > 0 ? calc.hevLitersPer100km.toFixed(2) : "",
      calc.distancePerDay > 0 ? calc.distancePerDay.toFixed(1) : "",
      calc.evDistancePerDay > 0 ? calc.evDistancePerDay.toFixed(1) : "",
      calc.hevDistancePerDay > 0 ? calc.hevDistancePerDay.toFixed(1) : "",
    ]
  })

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  return csvContent
}
