# Salary Calculator & Multi-Line Production Tracker

A complete single-page web application for tracking multi-line industrial production, quality control (QC), and tiered piece-rate salary calculations, integrated with Supabase PostgreSQL and deployable to Vercel in 1 click.

---

## ⚡ Core Business Rules & Pricing Tier Engine
- **Dynamic Tiered Rate per Line**:
  - **1 to 2 lines**: ₹2,500 per line (Tier 1)
  - **3 or more lines**: ₹3,000 per line (Tier 2, bonus rate applies to all lines)
  - **Manual Override**: Optional checkbox to override the rate per line with any custom amount.
- **Live Calculations**:
  - **Total Lines**: Count of dynamic lines added.
  - **Total Meters**: Sum of meters produced across all lines.
  - **QC Pass Rate**: `(Passed Lines / Total Lines) * 100`
  - **Total Payable**: `Total Lines * Active Rate per Line`

---

## 🚀 Features Included
1. **Dynamic Line Builder**: Add or remove lines on the fly with custom line codes, production meters, and QC status dropdowns (`Passed`, `Failed`, `Pending`).
2. **Real-Time Preview Card**: Shows current calculated rate, tier indicator badge, total meters, QC breakdown, and grand payable amount.
3. **Summary KPI Dashboard**: Top metrics cards for Grand Total Payable (₹), Total Production Lines, Total Meters Produced, and Quality Pass Rate (%).
4. **Records Log Table & Actions**: Filter by QC status (`All`, `Passed`, `Failed`, `Pending`), search by name or line ID, expandable line breakdowns, and delete entry functionality.
5. **Exports & Integration**:
   - **Excel Export (`.xlsx`)**: Formatted spreadsheet generated via SheetJS.
   - **Email Report Generator**: 1-click formatted plain-text copy or direct `mailto:` launcher.
6. **Supabase & Local Demo Mode**:
   - Out of the box, runs with a built-in Local Demo Mode so you can preview everything immediately.
   - Connects to Supabase PostgreSQL simply by clicking **Database Settings** in the navbar or updating the variables in `index.html`.

---

## 🗄️ Supabase PostgreSQL Setup (Already Configured & Live! 🎉)
The database has already been provisioned and configured using your personal access token:
- **Project Ref**: `sjhfbxgtctmaauodtges`
- **Region**: `ap-south-1` (Mumbai, India)
- **Status**: `ACTIVE_HEALTHY`
- **Project URL**: `https://sjhfbxgtctmaauodtges.supabase.co`
- **Tables Created**: `production_entries` & `production_line_items` (with cascading foreign key relationships, RLS policies, and performance indexes).

Your `index.html` has already been pre-wired with these live credentials so it will immediately load and save records to your Supabase PostgreSQL database!


---

## 🌐 Deploy to Vercel
### Option 1: Vercel CLI
```bash
npm install -g vercel
cd salary-production-tracker
vercel
```

### Option 2: GitHub & Vercel Dashboard
1. Push this folder to a GitHub repository.
2. In Vercel, click **Add New** -> **Project** -> Import the repository.
3. Leave Build and Output settings as default (static site).
4. Click **Deploy**!
