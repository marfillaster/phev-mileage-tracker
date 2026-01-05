"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Pencil, Zap, Fuel, DollarSign, Gauge, Info, ChevronRight, ChevronDown } from "lucide-react"
import type { MileageEntry } from "@/app/page"

interface MileageTableProps {
  entries: MileageEntry[]
  onUpdate: (entry: MileageEntry) => void
  onDelete: (id: string) => void
  onExport?: () => void
  currencySymbol: string
  currency?: string
}

export function MileageTable({
  entries,
  onUpdate,
  onDelete,
  onExport,
  currencySymbol = "₱",
  currency = "PHP",
}: MileageTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [distanceMode, setDistanceMode] = useState(0)
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [showDistancePerDay, setShowDistancePerDay] = useState(false) // This is now redundant due to distanceMode
  const [costView, setCostView] = useState<"total" | "perKm" | "perDay">("total")
  const [efficiencyUnit, setEfficiencyUnit] = useState<"kmPer" | "per100">("kmPer")
  const [energyView, setEnergyView] = useState<"total" | "perDay">("total")
  const [expandedFuel, setExpandedFuel] = useState<Set<string>>(new Set())

  const toggleFuelExpansion = (entryId: string) => {
    setExpandedFuel((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [entries])

  const cycleDistanceMode = () => {
    setDistanceMode((prev) => (prev + 1) % 3)
  }

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
        daysSince: 0,
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
      daysSince: daysSinceRefuel,
    }
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px] min-w-[110px] max-w-[110px]">Date</TableHead>
              <TableHead
                className="text-right cursor-pointer select-none w-[180px] min-w-[180px] max-w-[180px]"
                onClick={cycleDistanceMode}
              >
                <div className="flex items-center justify-end gap-2 w-full">
                  <span className="truncate">
                    {distanceMode === 0 && "ODO (km)"}
                    {distanceMode === 1 && "Distance (km)"}
                    {distanceMode === 2 && "Distance/Day (km/day)"}
                  </span>
                  <Popover
                    open={openPopover === "distance"}
                    onOpenChange={(open) => setOpenPopover(open ? "distance" : null)}
                  >
                    <PopoverTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        className="inline-flex h-5 w-5 items-center justify-center cursor-pointer flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenPopover(openPopover === "distance" ? null : "distance")
                          }
                        }}
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Distance formula</span>
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="end">
                      <div className="space-y-1">
                        {distanceMode === 0 ? (
                          <>
                            <p className="font-semibold">ODO readings:</p>
                            <p>Total ODO, EV ODO, HEV ODO</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">Distance:</p>
                            <p>Current ODO - Previous ODO</p>
                            {distanceMode === 2 && (
                              <>
                                <p className="font-semibold mt-2">Distance per day:</p>
                                <p>Distance / Days since refuel</p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-1">
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${distanceMode === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${distanceMode === 1 ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${distanceMode === 2 ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-right w-[140px] min-w-[140px] max-w-[140px]">
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={() => setEnergyView(energyView === "total" ? "perDay" : "total")}
                >
                  Energy
                  {energyView === "perDay" && "/Day"}
                  <Popover
                    open={openPopover === "energy"}
                    onOpenChange={(open) => setOpenPopover(open ? "energy" : null)}
                  >
                    <PopoverTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        className="inline-flex h-5 w-5 items-center justify-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenPopover(openPopover === "energy" ? null : "energy")
                          }
                        }}
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Energy formula</span>
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="end">
                      <div className="space-y-1">
                        <p className="font-semibold">Energy Consumed:</p>
                        <p>Current Plug-in - Previous Plug-in</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-1">
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${energyView === "total" ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                    />
                    <div
                      className={`h-1.5 w-1.5 rounded-full border ${energyView === "perDay" ? "bg-primary border-primary" : "bg-background border-muted-foreground"}`}
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="text-right w-[160px] min-w-[160px] max-w-[160px]">
                <div
                  className="flex items-center justify-end gap-2 cursor-pointer select-none"
                  onClick={() =>
                    setCostView((prev) => (prev === "total" ? "perKm" : prev === "perKm" ? "perDay" : "total"))
                  }
                >
                  Cost ({currencySymbol}){costView === "perKm" && "/km"}
                  {costView === "perDay" && "/day"}
                  <Popover open={openPopover === "cost"} onOpenChange={(open) => setOpenPopover(open ? "cost" : null)}>
                    <PopoverTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        className="inline-flex h-5 w-5 items-center justify-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenPopover(openPopover === "cost" ? null : "cost")
                          }
                        }}
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Cost formula</span>
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="end">
                      <div className="space-y-1.5">
                        <p className="font-semibold">Cost Metrics:</p>
                        <div>
                          <p className="text-xs font-medium">Total Cost:</p>
                          <p>Fuel Cost + Energy Cost</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cost per Kilometer ({currencySymbol}/km):</p>
                          <p className="text-xs">Combined: Total Cost ÷ Distance</p>
                          <p className="text-xs">EV: Energy Cost ÷ EV Distance</p>
                          <p className="text-xs">HEV: Fuel Cost ÷ HEV Distance</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">Cost per Day ({currencySymbol}/day):</p>
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
              <TableHead className="text-right w-[100px] min-w-[100px] max-w-[100px]">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEfficiencyUnit(efficiencyUnit === "kmPer" ? "per100" : "kmPer")}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  >
                    Efficiency
                    <Popover
                      open={openPopover === "efficiency"}
                      onOpenChange={(open) => setOpenPopover(open ? "efficiency" : null)}
                    >
                      <PopoverTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          className="inline-flex h-5 w-5 items-center justify-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenPopover(openPopover === "efficiency" ? null : "efficiency")
                            }
                          }}
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Efficiency formula</span>
                        </span>
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
                </div>
              </TableHead>
              <TableHead className="text-right w-[100px] min-w-[100px] max-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry, index) => {
              const prevEntry = sortedEntries[index + 1] || null
              const calculated = calculateValues(entry, prevEntry)
              const isFirstEntry = index === sortedEntries.length - 1
              const hideOdo = isFirstEntry && entry.odo === 0

              const isFuelExpanded = expandedFuel.has(entry.id)

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
                  <TableCell className="text-right w-[180px] min-w-[180px]">
                    <div className="w-full min-h-[60px]">
                      {distanceMode === 0 ? (
                        // ODO details view
                        <div className="space-y-1">
                          {!hideOdo && entry.odo && (
                            <p className="text-right flex items-center justify-end gap-1">
                              <Gauge className="h-3 w-3 text-orange-500" />
                              {entry.odo.toFixed(1)}
                            </p>
                          )}
                          {!hideOdo && entry.evOdo && (
                            <p className="text-sm text-muted-foreground text-right">EV {entry.evOdo.toFixed(1)}</p>
                          )}
                          {!hideOdo && entry.hevOdo && (
                            <p className="text-sm text-muted-foreground text-right">HEV {entry.hevOdo.toFixed(1)}</p>
                          )}
                        </div>
                      ) : distanceMode === 1 ? (
                        // Distance view
                        <div className="space-y-1">
                          <p className="font-medium">
                            {calculated.distance > 0 ? `${calculated.distance.toFixed(1)} km` : "-"}
                          </p>
                          {calculated.evDistance > 0 && (
                            <p className="text-sm text-muted-foreground">EV {calculated.evDistance.toFixed(1)}</p>
                          )}
                          {calculated.hevDistance > 0 && (
                            <p className="text-sm text-muted-foreground">HEV {calculated.hevDistance.toFixed(1)}</p>
                          )}
                        </div>
                      ) : (
                        // Distance per day view
                        <div className="space-y-1">
                          <p className="font-medium">
                            {calculated.distancePerDay > 0 ? `${calculated.distancePerDay.toFixed(1)} km/day` : "-"}
                          </p>
                          {calculated.evDistancePerDay > 0 && (
                            <p className="text-sm text-muted-foreground">EV {calculated.evDistancePerDay.toFixed(1)}</p>
                          )}
                          {calculated.hevDistancePerDay > 0 && (
                            <p className="text-sm text-muted-foreground">
                              HEV {calculated.hevDistancePerDay.toFixed(1)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="align-top w-[140px] min-w-[140px]">
                    {energyView === "total" ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                          <Gauge className="h-3 w-3 text-green-500" />
                          {calculated.daysSince > 0 ? (entry.pluginAmount / calculated.daysSince).toFixed(2) : "-"}{" "}
                          kWh/day
                        </p>
                        <p className="text-sm text-right">
                          {calculated.energy > 0 && calculated.daysSince > 0
                            ? `${(calculated.energy / calculated.daysSince).toFixed(2)} kWh/day`
                            : "-"}
                        </p>
                        {calculated.energy > 0 && (
                          <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3" />
                            {entry.energyTariff.toFixed(2)}/kWh
                          </p>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="align-top w-[160px] min-w-[160px]">
                    {costView === "total" ? (
                      <>
                        <p className="text-right font-medium">
                          {currencySymbol}
                          {calculated.totalCost.toFixed(2)}
                        </p>
                        {/* Energy cost row */}
                        {calculated.energyCost > 0 && (
                          <p className="text-sm text-muted-foreground text-right flex items-center justify-end gap-1 mt-1">
                            <Zap className="h-3 w-3" />
                            {currencySymbol}
                            {calculated.energyCost.toFixed(2)}
                          </p>
                        )}
                        {/* Fuel cost row with chevron toggle */}
                        <div className="flex items-center justify-end gap-1.5 text-sm text-muted-foreground mt-1">
                          <button
                            onClick={() => toggleFuelExpansion(entry.id)}
                            className="hover:text-foreground transition-colors p-0.5"
                            aria-label={isFuelExpanded ? "Hide fuel details" : "Show fuel details"}
                          >
                            {isFuelExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <Fuel className="h-3 w-3" />
                          <span>
                            {currencySymbol}
                            {entry.fuelCost.toFixed(2)}
                          </span>
                        </div>
                        {/* Expanded fuel details */}
                        {isFuelExpanded && (
                          <>
                            <p className="text-sm text-muted-foreground text-right pl-5">
                              {entry.fuelAmount.toFixed(2)} L
                            </p>
                            {calculated.costPerLiter > 0 && (
                              <p className="text-sm text-muted-foreground text-right pl-5">
                                {currencySymbol}
                                {calculated.costPerLiter.toFixed(2)}/L
                              </p>
                            )}
                          </>
                        )}
                      </>
                    ) : costView === "perKm" ? (
                      <>
                        <p className="text-right">
                          {currencySymbol}
                          {calculated.costPerKm > 0 ? calculated.costPerKm.toFixed(2) : "-"}/km
                        </p>
                        {calculated.evCostPerKm > 0 && (
                          <p className="text-sm text-muted-foreground text-right">
                            EV: {currencySymbol}
                            {calculated.evCostPerKm.toFixed(2)}/km
                          </p>
                        )}
                        {calculated.hevCostPerKm > 0 && (
                          <p className="text-sm text-muted-foreground text-right">
                            HEV: {currencySymbol}
                            {calculated.hevCostPerKm.toFixed(2)}/km
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-right">
                          {currencySymbol}
                          {calculated.costPerDay > 0 ? calculated.costPerDay.toFixed(2) : "-"}/day
                        </p>
                        {calculated.evCostPerDay > 0 && (
                          <p className="text-sm text-muted-foreground text-right">
                            EV: {currencySymbol}
                            {calculated.evCostPerDay.toFixed(2)}/day
                          </p>
                        )}
                        {calculated.hevCostPerDay > 0 && (
                          <p className="text-sm text-muted-foreground text-right">
                            HEV: {currencySymbol}
                            {calculated.hevCostPerDay.toFixed(2)}/day
                          </p>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="align-top w-[100px] min-w-[100px]">
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
                  <TableCell className="text-center align-top w-[100px] min-w-[100px]">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onUpdate(entry)} className="h-8 w-8">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedEntries.map((entry, index) => {
          const prevEntry = sortedEntries[index + 1] || null
          const calculated = calculateValues(entry, prevEntry)
          const isFirstEntry = index === sortedEntries.length - 1
          const hideOdo = isFirstEntry && entry.odo === 0

          const isFuelExpanded = expandedFuel.has(entry.id)

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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdate(entry)}
                      className="h-10 w-10 touch-manipulation"
                    >
                      <Pencil className="h-5 w-5" />
                      <span className="sr-only">Edit entry</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(entry.id)}
                      className="h-10 w-10 touch-manipulation"
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <span className="sr-only">Delete entry</span>
                    </Button>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                  <dt className="text-muted-foreground flex items-start justify-between">
                    <span>
                      {distanceMode === 0 && "ODO"}
                      {distanceMode === 1 && "Distance"}
                      {distanceMode === 2 && "Distance/day"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={cycleDistanceMode} className="flex items-center gap-1 p-1">
                        <div className="flex gap-0.5">
                          <div
                            className={`h-1.5 w-1.5 rounded-full border ${
                              distanceMode === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                            }`}
                          />
                          <div
                            className={`h-1.5 w-1.5 rounded-full border ${
                              distanceMode === 1 ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                            }`}
                          />
                          <div
                            className={`h-1.5 w-1.5 rounded-full border ${
                              distanceMode === 2 ? "bg-primary border-primary" : "bg-background border-muted-foreground"
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
                            {distanceMode === 0 ? (
                              <>
                                <p className="font-semibold">ODO readings:</p>
                                <p>Total ODO, EV ODO, HEV ODO</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold">Distance:</p>
                                <p>Current ODO - Previous ODO</p>
                                {distanceMode === 2 && (
                                  <>
                                    <p className="font-semibold mt-2">Distance per day:</p>
                                    <p>Distance / Days since refuel</p>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </dt>
                  <dd className="text-right font-medium">
                    {distanceMode === 0 ? (
                      // ODO details
                      !hideOdo && entry.odo ? (
                        <div className="flex items-center justify-end gap-1">
                          <Gauge className="h-3 w-3 text-orange-500" />
                          {entry.odo.toFixed(1)} km
                        </div>
                      ) : null
                    ) : distanceMode === 1 ? (
                      // Distance
                      calculated.distance > 0 ? (
                        `${calculated.distance.toFixed(1)} km`
                      ) : (
                        "-"
                      )
                    ) : // Distance per day
                    calculated.distancePerDay > 0 ? (
                      `${calculated.distancePerDay.toFixed(1)} km/d`
                    ) : (
                      "-"
                    )}
                  </dd>

                  {distanceMode === 0 ? (
                    // ODO details - EV ODO
                    !hideOdo && entry.evOdo ? (
                      <>
                        <dt className="text-muted-foreground pl-4 align-top">EV ODO</dt>
                        <dd className="text-right align-top">{entry.evOdo.toFixed(1)} km</dd>
                      </>
                    ) : null
                  ) : distanceMode === 1 ? (
                    // Distance - EV Distance
                    calculated.evDistance > 0 ? (
                      <>
                        <dt className="text-muted-foreground pl-4 align-top">EV</dt>
                        <dd className="text-right align-top">{calculated.evDistance.toFixed(1)} km</dd>
                      </>
                    ) : null
                  ) : // Distance per day - EV Distance per day
                  calculated.evDistancePerDay > 0 ? (
                    <>
                      <dt className="text-muted-foreground pl-4 align-top">EV</dt>
                      <dd className="text-right align-top">{calculated.evDistancePerDay.toFixed(1)} km/d</dd>
                    </>
                  ) : null}

                  {distanceMode === 0 ? (
                    // ODO details - HEV ODO
                    !hideOdo && entry.hevOdo ? (
                      <>
                        <dt className="text-muted-foreground pl-4 align-top">HEV ODO</dt>
                        <dd className="text-right align-top">{entry.hevOdo.toFixed(1)} km</dd>
                      </>
                    ) : null
                  ) : distanceMode === 1 ? (
                    // Distance - HEV Distance
                    calculated.hevDistance > 0 ? (
                      <>
                        <dt className="text-muted-foreground pl-4 align-top">HEV</dt>
                        <dd className="text-right align-top">{calculated.hevDistance.toFixed(1)} km</dd>
                      </>
                    ) : null
                  ) : // Distance per day - HEV Distance per day
                  calculated.hevDistancePerDay > 0 ? (
                    <>
                      <dt className="text-muted-foreground pl-4 align-top">HEV</dt>
                      <dd className="text-right align-top">{calculated.hevDistancePerDay.toFixed(1)} km/d</dd>
                    </>
                  ) : null}

                  <dt className="text-muted-foreground font-medium align-top">Total Cost</dt>
                  <dd className="text-right font-medium align-top">
                    {currencySymbol}
                    {calculated.totalCost.toFixed(2)}
                  </dd>

                  {calculated.energyCost > 0 && (
                    <>
                      <dt className="text-muted-foreground flex items-center gap-1 align-top">
                        <Zap className="h-3 w-3" />
                        Energy Cost
                      </dt>
                      <dd className="text-right align-top">
                        {currencySymbol}
                        {calculated.energyCost.toFixed(2)}
                      </dd>
                    </>
                  )}

                  {entry.fuelCost > 0 && (
                    <>
                      <dt className="text-muted-foreground align-top">
                        <button
                          onClick={() => toggleFuelExpansion(entry.id)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          aria-label={isFuelExpanded ? "Hide fuel details" : "Show fuel details"}
                        >
                          {isFuelExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          Fuel Cost
                        </button>
                      </dt>
                      <dd className="text-right align-top">
                        {currencySymbol}
                        {entry.fuelCost.toFixed(2)}
                      </dd>

                      {isFuelExpanded && (
                        <>
                          <dt className="text-muted-foreground pl-4 text-xs align-top">Fuel Amount</dt>
                          <dd className="text-right text-xs align-top">{entry.fuelAmount.toFixed(2)} L</dd>

                          <dt className="text-muted-foreground pl-4 text-xs align-top">Cost per Liter</dt>
                          <dd className="text-right text-xs align-top">
                            {currencySymbol}
                            {calculated.costPerLiter.toFixed(2)}/L
                          </dd>
                        </>
                      )}
                    </>
                  )}

                  <dt className="text-muted-foreground flex items-center gap-1 align-top">
                    <Gauge className="h-3 w-3 text-green-500" />
                    Plug-in
                  </dt>
                  <dd className="text-right align-top">{entry.pluginAmount.toFixed(2)} kWh</dd>

                  <dt className="text-muted-foreground align-top">Energy Used</dt>
                  <dd className="text-right align-top">
                    {calculated.energy > 0 ? `${calculated.energy.toFixed(2)} kWh` : "-"}
                  </dd>

                  <dt className="text-muted-foreground flex items-center gap-1 align-top">
                    <DollarSign className="h-3 w-3" />
                    Tariff
                  </dt>
                  <dd className="text-right align-top">
                    {currencySymbol}
                    {entry.energyTariff.toFixed(2)}/kWh
                  </dd>

                  {calculated.energyCost > 0 && (
                    <>
                      <dt className="text-muted-foreground flex items-center gap-1 align-top">
                        <Zap className="h-3 w-3" />
                        Energy Cost
                      </dt>
                      <dd className="text-right align-top">
                        {currencySymbol}
                        {calculated.energyCost.toFixed(2)}
                      </dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ADDED closing fragment tag here */}
    </>
  )
}

export function generateCSV(entries: MileageEntry[], currencySymbol = "₱"): string {
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
        daysSince: 0,
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
      daysSince: daysSinceRefuel,
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
    `Fuel Cost (${currencySymbol})`,
    `Cost per Liter (${currencySymbol}/L)`,
    "Plug-in Amount (kWh)",
    "Energy Used (kWh)",
    `Energy Tariff (${currencySymbol}/kWh)`,
    `Energy Cost (${currencySymbol})`,
    `Total Cost (${currencySymbol})`,
    `Cost per Day (${currencySymbol}/day)`,
    `EV Cost per Day (${currencySymbol}/day)`,
    `HEV Cost per Day (${currencySymbol}/day)`,
    `Cost per km (${currencySymbol}/km)`,
    `EV Cost per km (${currencySymbol}/km)`,
    `HEV Cost per km (${currencySymbol}/km)`,
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
    "Energy Used/day (kWh/day)",
    `Total Cost/day (${currencySymbol}/day)`,
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
      calc.daysSince > 0 ? (entry.pluginAmount / calc.daysSince).toFixed(2) : "",
      calc.daysSince > 0 ? (calc.totalCost / calc.daysSince).toFixed(2) : "",
    ]
  })

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  return csvContent
}
