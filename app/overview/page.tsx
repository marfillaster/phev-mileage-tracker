"use client"

import { useState, useEffect } from "react"
import type { MileageEntry } from "../page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Fuel, Zap, DollarSign, Gauge, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TimeRange = "year" | "sixMonths"

export default function OverviewPage() {
  const [entries, setEntries] = useState<MileageEntry[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>("year")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    const stored = localStorage.getItem("phev-mileage-entries")
    console.log("[v0] Stored entries:", stored)
    if (stored) {
      const parsedEntries = JSON.parse(stored)
      console.log("[v0] Parsed entries:", parsedEntries.length, "entries")
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

  const getFilteredEntries = () => {
    const now = new Date()
    const cutoffDate = new Date()

    if (timeRange === "year") {
      return entries
        .filter((entry) => new Date(entry.date).getFullYear() === selectedYear)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else {
      cutoffDate.setMonth(now.getMonth() - 6)
      return entries
        .filter((entry) => new Date(entry.date) >= cutoffDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
  }

  const calculateMetrics = () => {
    const filtered = getFilteredEntries()

    if (filtered.length < 2) {
      return null
    }

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

    for (let i = 1; i < filtered.length; i++) {
      const current = filtered[i]
      const previous = filtered[i - 1]

      const distance = current.odo - previous.odo
      totalDistance += distance

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

      const daysDiff = (new Date(current.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
      totalDays += daysDiff
    }

    const totalCost = totalFuelCost + totalEnergyCost
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
    const evCostPerKm =
      totalEvDistance > 0 && evEnergy > 0 ? (evEnergy * (totalEnergyCost / totalEnergy)) / totalEvDistance : 0
    const hevCostPerKm =
      totalHevDistance > 0 && hevFuelAmount > 0
        ? (hevFuelAmount * (totalFuelCost / totalFuelAmount)) / totalHevDistance
        : 0
    const fuelEfficiency = totalFuelAmount > 0 ? totalDistance / totalFuelAmount : 0
    const hevFuelEfficiency = hevFuelAmount > 0 && totalHevDistance > 0 ? totalHevDistance / hevFuelAmount : 0
    const evEfficiency = evEnergy > 0 && totalEvDistance > 0 ? totalEvDistance / evEnergy : 0
    const avgDistancePerDay = totalDays > 0 ? totalDistance / totalDays : 0
    const avgCostPerDay = totalDays > 0 ? totalCost / totalDays : 0

    const costPerLiter = totalFuelAmount > 0 ? totalFuelCost / totalFuelAmount : 0
    const energyEquivalentLiters = costPerLiter > 0 ? totalEnergyCost / costPerLiter : 0
    const combinedKmPerLiter =
      totalFuelAmount + energyEquivalentLiters > 0 ? totalDistance / (totalFuelAmount + energyEquivalentLiters) : 0
    const evEquivalentKmPerLiter =
      costPerLiter > 0 && evEnergy > 0 && totalEvDistance > 0
        ? totalEvDistance / ((evEnergy * (totalEnergyCost / totalEnergy)) / costPerLiter)
        : 0

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
      fuelEfficiency,
      hevFuelEfficiency,
      evEfficiency,
      combinedKmPerLiter,
      evEquivalentKmPerLiter,
      avgDistancePerDay,
      avgCostPerDay,
      totalDays,
      entryCount: filtered.length,
      hevFuelAmount,
      evEnergy,
    }
  }

  const metrics = calculateMetrics()

  console.log("[v0] Entries length:", entries.length)
  console.log("[v0] Metrics:", metrics)
  console.log("[v0] Time range:", timeRange)
  console.log("[v0] Selected year:", selectedYear)

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
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
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
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
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
                <CardTitle className="text-sm font-medium">Cost per km</CardTitle>
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
                <CardTitle className="text-sm font-medium">Efficiency & Consumption</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Gauge className="h-3 w-3" />
                      <span className="text-xs">Combined</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.combinedKmPerLiter.toFixed(2)} km/L</div>
                    <p className="text-xs text-muted-foreground">Fuel + energy cost equivalent</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Fuel className="h-3 w-3" />
                      <span className="text-xs">HEV Fuel</span>
                    </div>
                    <div className="text-lg font-bold">
                      {metrics.hevFuelEfficiency > 0 ? `${metrics.hevFuelEfficiency.toFixed(2)} km/L` : "No HEV data"}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.hevFuelAmount.toFixed(1)} L consumed</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">EV Energy</span>
                    </div>
                    <div className="text-lg font-bold">
                      {metrics.evEfficiency > 0 ? `${metrics.evEfficiency.toFixed(2)} km/kWh` : "No EV data"}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.evEnergy.toFixed(1)} kWh consumed</p>
                  </div>

                  {metrics.evEquivalentKmPerLiter > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">EV as km/L</span>
                      </div>
                      <div className="text-lg font-bold">{metrics.evEquivalentKmPerLiter.toFixed(2)} km/L*</div>
                      <p className="text-xs text-muted-foreground">Cost-equivalent efficiency</p>
                    </div>
                  )}
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
                <p className="text-xs text-muted-foreground mt-1">Based on {metrics.entryCount} entries</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
