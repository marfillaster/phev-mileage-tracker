"use client"

import { useState, useEffect } from "react"
import type { MileageEntry } from "../page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Calendar, Fuel, Zap, DollarSign, Gauge, TrendingUp, Info } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type TimeRange = "year" | "sixMonths"

export default function OverviewPage() {
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("year")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [efficiencyUnit, setEfficiencyUnit] = useState<"kmPer" | "per100">("kmPer")
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [evEfficiency, setEvEfficiency] = useState<number>(0) // Declare evEfficiency
  const [hevFuelEfficiency, setHevFuelEfficiency] = useState<number>(0) // Declare hevFuelEfficiency

  useEffect(() => {
    const stored = localStorage.getItem("phev-mileage-entries")
    if (stored) {
      const parsedEntries = JSON.parse(stored)
      setEntries(parsedEntries)
    }
  }, [])

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

      const distance = current.odo - previous.odo
      totalDistance += distance

      if (current.hevOdo && current.evOdo) {
        completeEntryCount++
      }

      if (current.hevOdo && previous.hevOdo) {
        const hevDistance = current.hevOdo - previous.hevOdo
        totalHevDistance += hevDistance
        hevFuelAmount += current.fuelAmount
      }

      if (current.evOdo && previous.evOdo) {
        const evDistance = current.evOdo - previous.evOdo
        totalEvDistance += evDistance

        const energy = current.pluginAmount - previous.pluginAmount
        evEnergy += energy
      }

      totalFuelAmount += current.fuelAmount
      totalFuelCost += current.fuelCost

      const energy = current.pluginAmount - previous.pluginAmount
      totalEnergy += energy
      totalEnergyCost += energy * current.energyTariff

      // Only count days if both entries have complete HEV and EV ODO data
      if (current.hevOdo && current.evOdo && previous.hevOdo && previous.evOdo) {
        const daysDiff = (new Date(current.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
        totalDays += daysDiff
        console.log("[v0] Adding days:", daysDiff, "from", previous.date, "to", current.date)
      }
    }

    console.log("[v0] Total days calculated:", totalDays)
    console.log("[v0] Complete entry count:", completeEntryCount)

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

  const metrics = calculateMetrics(entries)

  if (entries.length < 3) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Mileage Log
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
            <p className="text-muted-foreground">Dashboard metrics for your PHEV</p>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
            <div className="text-center space-y-4 max-w-md">
              <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Not enough data yet</h3>
              <p className="text-muted-foreground">
                You need at least 3 mileage entries to view dashboard metrics. Add more entries in the Mileage Log to
                see your vehicle's performance overview.
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
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Mileage Log
              </Button>
            </Link>
            <div className="flex items-start justify-between flex-col md:flex-row gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
                <p className="text-muted-foreground">Dashboard metrics for your PHEV</p>
              </div>
              <div className="flex gap-2 items-center">
                {availableYears.length > 1 && timeRange === "year" && (
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant={timeRange === "year" ? "default" : "outline"} onClick={() => setTimeRange("year")}>
                  {availableYears.length > 1 ? "By Year" : "Last Year"}
                </Button>
                <Button
                  variant={timeRange === "sixMonths" ? "default" : "outline"}
                  onClick={() => setTimeRange("sixMonths")}
                >
                  Last 6 Months
                </Button>
              </div>
            </div>
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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Mileage Log
            </Button>
          </Link>
          <div className="flex items-start justify-between flex-col md:flex-row gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
              <p className="text-muted-foreground">Dashboard metrics for your PHEV</p>
            </div>
            <div className="flex gap-2 items-center">
              {availableYears.length > 1 && timeRange === "year" && (
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant={timeRange === "year" ? "default" : "outline"} onClick={() => setTimeRange("year")}>
                {availableYears.length > 1 ? "By Year" : "Last Year"}
              </Button>
              <Button
                variant={timeRange === "sixMonths" ? "default" : "outline"}
                onClick={() => setTimeRange("sixMonths")}
              >
                Last 6 Months
              </Button>
            </div>
          </div>
        </div>

        {metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
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
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalDistance.toFixed(0)} km</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.avgDistancePerDay.toFixed(1)} km/day average
                </p>
                {metrics.totalEvDistance > 0 && (
                  <p className="text-xs text-muted-foreground">EV: {metrics.totalEvDistance.toFixed(0)} km</p>
                )}
                {metrics.totalHevDistance > 0 && (
                  <p className="text-xs text-muted-foreground">HEV: {metrics.totalHevDistance.toFixed(0)} km</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <Popover
                    open={openPopover === "totalCost"}
                    onOpenChange={(open) => setOpenPopover(open ? "totalCost" : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Total cost info</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="start">
                      <div className="space-y-1">
                        <p className="font-semibold">Total Cost:</p>
                        <p>Fuel Cost + Energy Cost</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{metrics.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">₱{metrics.avgCostPerDay.toFixed(2)}/day average</p>
                <p className="text-xs text-muted-foreground">Fuel: ₱{metrics.totalFuelCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Energy: ₱{metrics.totalEnergyCost.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">Cost per km</CardTitle>
                  <Popover
                    open={openPopover === "costPerKm"}
                    onOpenChange={(open) => setOpenPopover(open ? "costPerKm" : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <Info className="h-3.5 w-3.5" />
                        <span className="sr-only">Cost per km info</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto text-sm" align="start">
                      <div className="space-y-1.5">
                        <p className="font-semibold">Cost per Kilometer:</p>
                        <div>
                          <p className="text-xs font-medium">Combined:</p>
                          <p className="text-xs">Total Cost ÷ Total Distance</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">EV:</p>
                          <p className="text-xs">Energy Cost ÷ EV Distance</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">HEV:</p>
                          <p className="text-xs">Fuel Cost ÷ HEV Distance</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{metrics.costPerKm.toFixed(2)}/km</div>
                <p className="text-xs text-muted-foreground mt-1">Combined fuel and energy costs</p>
                {metrics.evCostPerKm > 0 && (
                  <p className="text-xs text-muted-foreground">EV: ₱{metrics.evCostPerKm.toFixed(2)}/km</p>
                )}
                {metrics.hevCostPerKm > 0 && (
                  <p className="text-xs text-muted-foreground">HEV: ₱{metrics.hevCostPerKm.toFixed(2)}/km</p>
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
      <Footer />
    </main>
  )
}
