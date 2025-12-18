# PHEV Mileage Tracker

A comprehensive web application for tracking and analyzing Plug-in Hybrid Electric Vehicle (PHEV) mileage, fuel consumption, and energy usage. Built with Next.js 16, React 19, and Tailwind CSS.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ken-marfillas-projects/v0-phev-mileage-tracker)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/qtxAyLGPXJo)

## Features

### 📊 Mileage Tracking
- **Detailed Entry Logging** - Record every refueling with comprehensive data including date, odometer readings, fuel amounts, costs, and energy consumption
- **Multi-Mode Tracking** - Track combined, HEV (Hybrid), and EV (Electric) modes separately with dedicated ODO readings
- **Flexible Data Entry** - Optional HEV and EV ODO fields allow tracking to start before these metrics are available
- **Out-of-Order Entries** - Add entries in any order, perfect for catching up on missed records

### 📈 Overview Dashboard
- **Key Metrics at a Glance** - View total distance, costs, efficiency, and consumption for selected time periods
- **Flexible Time Ranges** - Toggle between last 6 months or yearly view
- **Multi-Year Support** - Select specific years when you have historical data
- **Comprehensive Cost Analysis** - See combined, EV, and HEV cost per kilometer breakdowns
- **Efficiency Insights** - Track fuel efficiency (km/L or L/100km) and energy efficiency (Wh/km or kWh/100km)

### 📋 Mileage Log Table
- **Sortable Entries** - View all entries sorted by date (newest first)
- **Calculated Metrics** - Automatically computes distance traveled, energy consumed, costs, and efficiency between fill-ups
- **Interactive Columns** - Toggle between different views:
  - Distance: Total vs. Distance per day
  - Cost: Total vs. Cost per km vs. Cost per day
  - Efficiency: km/L & Wh/km vs. L/100km & kWh/100km
- **Formula Tooltips** - Click info icons to see calculation formulas for computed values
- **Edit & Delete** - Modify or remove entries with navigation between records
- **Responsive Design** - Desktop table view transforms to card layout on mobile devices

### 💾 Data Management
- **Local Storage** - All data stored in browser localStorage for instant access
- **Import/Export** - Transfer data between devices using JSON files
- **CSV Export** - Download complete data with all calculated metrics for spreadsheet analysis
- **PWA Support** - Install as a progressive web app for offline functionality

### 🎨 User Experience
- **Dark Mode** - Toggle between light and dark themes with persistent preference
- **Mobile Optimized** - Card-based layout for easy viewing on phones
- **Help Guide** - Built-in instructions showing where to find each data field
- **Visual Indicators** - Colored icons and dot indicators for easy recognition
- **Responsive Forms** - Validated data entry with clear error messages

## Data Fields

### Required Fields
- **Date** - Full-tank refueling date
- **ODO (km)** - Total vehicle odometer reading (from instrument cluster)
- **Fuel Amount (liters)** - Amount of fuel added (from gas receipt)
- **Fuel Cost (₱)** - Gross amount paid for fuel (from gas receipt)
- **Plug-in Amount (kWh)** - Cumulative charging capacity (Settings > Energy > Energy Consumption > External Charging Capacity)
- **Energy Tariff (₱/kWh)** - Electricity rate (from utility bill, default: 14)

### Optional Fields
- **HEV ODO (km)** - HEV mode-specific odometer (from instrument cluster)
- **EV ODO (km)** - EV mode-specific odometer (from instrument cluster)

## Calculated Metrics

### Distance Metrics
- **Total Distance** - Current ODO - Previous ODO
- **HEV Distance** - Current HEV ODO - Previous HEV ODO
- **EV Distance** - Current EV ODO - Previous EV ODO
- **Distance per Day** - Total Distance / Days since last refueling

### Cost Metrics
- **Energy Cost** - Energy Consumed (kWh) × Energy Tariff
- **Total Cost** - Fuel Cost + Energy Cost
- **Cost per km (Combined)** - Total Cost / Total Distance
- **Cost per km (EV)** - Energy Cost / EV Distance
- **Cost per km (HEV)** - Fuel Cost / HEV Distance
- **Cost per Day** - Total Cost / Days since last refueling

### Efficiency Metrics
- **Combined km/L** - Distance / (Fuel Amount + Energy Cost / Cost per Liter)
- **HEV km/L** - HEV Distance / Fuel Amount
- **EV Wh/km** - (Energy Consumed × 1000) / EV Distance
- **EV km/L (equivalent)** - EV Distance / (Energy Cost / Cost per Liter)
- **L/100km formats** - Inverse calculations for standard efficiency metrics

### Energy Metrics
- **Energy Consumed (kWh)** - Current Plug-in Amount - Previous Plug-in Amount

## Technology Stack

- **Framework** - Next.js 16 (App Router)
- **UI Library** - React 19.2
- **Styling** - Tailwind CSS v4
- **Components** - shadcn/ui
- **Icons** - Lucide React
- **Charts** - Recharts (optional)
- **Deployment** - Vercel
- **Type Safety** - TypeScript

## Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/marfillaster/phev-mileage-tracker.git
cd phev-mileage-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/marfillaster/phev-mileage-tracker)

## Usage

### Getting Started

1. **First Time Setup**
   - On first visit, the help guide will appear automatically
   - Review the data collection guide to understand where to find each field
   - Access the help guide anytime from the menu (☰ icon)

2. **Adding Your First Entry**
   - Click "Add Entry" button
   - Fill in all required fields (marked with *)
   - HEV ODO and EV ODO are optional - add them when available
   - Submit to save the entry

3. **Tracking Over Time**
   - Add a new entry after each full-tank refueling
   - The app automatically calculates distances, costs, and efficiency
   - View metrics in the Overview page once you have 3+ entries

### Best Practices

- **Consistent Timing** - Record entries immediately after refueling for accuracy
- **Full Tank Required** - Always fill to full tank for accurate fuel consumption tracking
- **Update Tariff** - Change energy tariff field when electricity rates change
- **Regular Backups** - Export your data regularly to prevent loss
- **HEV/EV Tracking** - Start recording HEV/EV ODO as soon as you become familiar with the instrument cluster

### Data Migration

**Export Data:**
1. Open menu (☰ icon)
2. Select "Export"
3. Save the JSON file

**Import Data:**
1. Open menu (☰ icon)
2. Select "Import"
3. Choose your previously exported JSON file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Copyright © 2025 [marfillaster](https://github.com/marfillaster)

This project is open source and available under the MIT License.

## Links

- **Live App**: [https://vercel.com/ken-marfillas-projects/v0-phev-mileage-tracker](https://vercel.com/ken-marfillas-projects/v0-phev-mileage-tracker)
- **GitHub Repository**: [https://github.com/marfillaster/phev-mileage-tracker](https://github.com/marfillaster/phev-mileage-tracker)
- **Built with v0**: [https://v0.app/chat/qtxAyLGPXJo](https://v0.app/chat/qtxAyLGPXJo)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/marfillaster/phev-mileage-tracker/issues) on GitHub.

---

*Built with [v0.app](https://v0.app) - Ship stunning apps faster with AI*
