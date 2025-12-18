import type { MileageEntry } from "./vehicle-storage"

export function handleExport(entries: MileageEntry[]) {
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

export function handleExportCSV(entries: MileageEntry[], generateCSV: (entries: MileageEntry[]) => string) {
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
