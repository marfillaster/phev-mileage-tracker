"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Info } from "lucide-react"

interface HelpInstructionsProps {
  open: boolean
  onClose: () => void
}

export function HelpInstructions({ open, onClose }: HelpInstructionsProps) {
  const fields = [
    {
      field: "Full Tank Date",
      whereToFind: "The date when you refuel to full tank",
    },
    {
      field: "EV ODO (km)",
      whereToFind: "Tap the button on the tip of left stalk to cycle through ODO displays in instrument cluster",
      note: "Shows electric-only distance traveled",
    },
    {
      field: "HEV ODO (km)",
      whereToFind: "Tap the button on the tip of left stalk to cycle through ODO displays in instrument cluster",
      note: "Shows hybrid engine distance traveled",
    },
    {
      field: "ODO (km)",
      whereToFind: "Tap the button on the tip of left stalk to cycle through ODO displays in instrument cluster",
      note: "Shows total distance traveled",
    },
    {
      field: "Plug-in Amount (kWh)",
      whereToFind: "Settings → Energy → Energy Consumption → External Charging Capacity",
      note: "Shows total kWh charged from external source",
    },
    {
      field: "Tariff Rate (₱/kWh)",
      whereToFind: "Get from your most recent utility bill",
      note: "Used to calculate energy cost",
    },
    {
      field: "Fuel Amount (Liters)",
      whereToFind: "Found on gas station receipt",
      note: "Amount of fuel added to reach full tank",
    },
    {
      field: "Fuel Cost (₱)",
      whereToFind: "Gross amount on gas station receipt",
      note: "Total cost of fuel purchased",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[calc(100vw-2rem)]" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Data Collection Guide
          </DialogTitle>
          <DialogDescription>
            Learn where to find each data field needed to track your PHEV mileage accurately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-muted-foreground text-sm">
              Record these values each time you refuel to a full tank. This helps you track your PHEV's fuel efficiency
              and electric consumption accurately.
            </p>
          </div>

          <div className="space-y-3">
            {fields.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="font-semibold text-sm">{item.field}</div>
                <div className="text-sm text-muted-foreground break-words">{item.whereToFind}</div>
                {item.note && <div className="text-xs text-muted-foreground italic">{item.note}</div>}
              </div>
            ))}
          </div>

          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-sm">💡 Tip</h4>
            <p className="text-xs text-muted-foreground break-words">
              For accurate tracking, always refuel to full tank and record all values immediately. This ensures
              consistent measurements and reliable efficiency calculations.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
