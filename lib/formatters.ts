/**
 * Format date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", options || { year: "numeric", month: "short", day: "numeric" })
}

/**
 * Format date for input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().split("T")[0]
}

/**
 * Format number with fixed decimals
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = "PHP", decimals = 2): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${formatNumber(amount, decimals)}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
  }
  return symbols[currency] || "₱"
}

/**
 * Format distance with unit
 */
export function formatDistance(km: number, unit: "km" | "miles" = "km", decimals = 1): string {
  if (unit === "miles") {
    const miles = km * 0.621371
    return `${formatNumber(miles, decimals)} mi`
  }
  return `${formatNumber(km, decimals)} km`
}

/**
 * Format fuel efficiency
 */
export function formatFuelEfficiency(kmPerLiter: number, unit: "km" | "miles" = "km", decimals = 2): string {
  if (unit === "miles") {
    const mpg = kmPerLiter * 2.352145833 // km/L to MPG
    return `${formatNumber(mpg, decimals)} MPG`
  }
  return `${formatNumber(kmPerLiter, decimals)} km/L`
}

/**
 * Format energy consumption
 */
export function formatEnergyConsumption(kwhPer100km: number, unit: "km" | "miles" = "km", decimals = 2): string {
  if (unit === "miles") {
    const whPerMile = (kwhPer100km / 100) * 0.621371 * 1000
    return `${formatNumber(whPerMile, 0)} Wh/mi`
  }
  return `${formatNumber(kwhPer100km, decimals)} kWh/100km`
}

/**
 * Format Wh/km or Wh/mile
 */
export function formatWhPerDistance(whPerKm: number, unit: "km" | "miles" = "km"): string {
  if (unit === "miles") {
    const whPerMile = whPerKm / 0.621371
    return `${formatNumber(whPerMile, 0)} Wh/mi`
  }
  return `${formatNumber(whPerKm, 0)} Wh/km`
}

/**
 * Format days with proper pluralization
 */
export function formatDays(days: number): string {
  const rounded = Math.round(days)
  return rounded === 1 ? "1 day" : `${rounded} days`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}
