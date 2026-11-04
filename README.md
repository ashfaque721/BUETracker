# BUETracker 🎓
> **High-Performance Academic Routine Designer, Continuous Assessment Engine & CGPA Tracker for BUET (Bangladesh University of Engineering and Technology) Students.**

Built with **Electron + Vite + React (TypeScript) + Tailwind CSS + Recharts + Dexie.js (IndexedDB)**.

---

## ✨ Features Overview

### 🗓️ Module A: BUET Departmental Timetable Designer & High-Res Exporter
Replicates the official BUET departmental routine schedule:
- **Days:** Saturday, Sunday, Monday, Tuesday, Wednesday. (BUET weekends: Thursday & Friday).
- **Official Periods:**
  - Period 1: `8:00 - 8:50`
  - Period 2: `9:00 - 9:50`
  - Period 3: `10:00 - 10:50`
  - Period 4: `11:00 - 11:50`
  - Period 5: `12:00 - 12:50`
  - Period 6: `1:00 - 1:30`
  - **RECESS:** Fixed vertical column between Period 6 and 7 (`1:30 - 2:30`) for Prayer & Lunch Break.
  - Period 7: `2:30 - 5:00` (Dedicated 2.5-hour afternoon sessional/lab slot).
- **Exact Cell Structure:**
  - **Line 1:** Course Code (e.g. `ME 243`, `IPE 205`)
  - **Line 2:** Course Nickname / Topic in parentheses (e.g. `(Solid Mech)`, `(Mfg I Lab)`)
  - **Line 3:** Teacher Initials / Name (e.g. `SA Ma'am`, `Kayes Sir`)
  - **Line 4:** Room / Lab details (e.g. `Room: IPE 317`, `SM Lab`)
- **Multi-Period Spans:** Supports 2-period and 3-period merged spans (for morning labs or double lectures).
- **High-Res Exporter:**
  - **Crisp 2X PNG Export:** High-DPI canvas render suitable for sharing and phone wallpapers.
  - **A4 Landscape PDF Export:** Vector PDF generated via `jspdf`.
  - **Native Print:** Browser and desktop print layout (`Ctrl+P`).

---

### 🎯 Module C: BUET Ordinance Continuous Assessment Engine (Ongoing Courses)
Continuous assessment accounts for 30% of total course marks ($30n$), with Term Final accounting for 70% ($70n$):

#### 1. Attendance Engine (10% Weight)
- For an $n$-credit course, attendance marks = $n \times 10$:
  - $\ge 90\% \implies 10/10$ points ($\implies n \times 10$ marks)
  - $85\% - 89\% \implies 9/10$ points ($\implies 9n$ marks)
  - $80\% - 84\% \implies 8/10$ points ($\implies 8n$ marks)
  - $75\% - 79\% \implies 7/10$ points ($\implies 7n$ marks)
  - $70\% - 74\% \implies 6/10$ points ($\implies 6n$ marks)
  - $65\% - 69\% \implies 5/10$ points ($\implies 5n$ marks)
  - $60\% - 64\% \implies 4/10$ points ($\implies 4n$ marks)
  - $< 60\% \implies 0/10$ points (**Non-Collegiate / Ineligible warning triggered!**)
- **Attendance Analytics:**
  - **Safe Bunks Available:** Exact number of future consecutive classes a student can miss before dropping below the current slab or under 60%.
  - **Classes Needed for Next Slab:** Consecutive classes to attend to jump up to the next grade slab.
  - Quick `+1 Present` and `+1 Absent` logging buttons.

#### 2. Class Test (CT) Engine (20% Weight)
- **Best $n$ of $n+1$ Rule:** For an $n$-credit theory course, automatically counts the best $n$ tests out of $n+1$ (e.g., best 3 of 4 for a 3-credit course, best 2 of 3 for a 2-credit course, best 4 of 5 for a 4-credit course).
- **Normalization:** Each CT can be scored out of any base (e.g., 20, 25, 30), normalized dynamically to standard base 20, sorted descending, and summed for top $k$ tests.
- **Manual Override:** Flexible toggle to override $k$ (e.g., best 2 of 4, makeup CTs, or taking all tests).
- Visual status badges: Green `"✓ Counted in Best k"` vs strikethrough `"Dropped"`.

#### 3. Term Final (TF) Target Matrix (70% Weight)
- Total course marks = $100n$.
- Term Final max marks = $70n$.
- Continuous obtained = $\text{Att Marks} + \text{CT Marks}$ (out of $30n$).
- Real-time targets calculated for every BUET letter grade:
  - **A+ (80%)**: Total $80n$ required $\implies$ Marks needed in TF (and exam percentage required).
  - **A (75%)**, **A- (70%)**, **B+ (65%)**, **B (60%)**, **B- (55%)**, **C+ (50%)**, **C (45%)**, **D (40%)**.
- **Section A and Section B Split:** Automatically calculates 50/50 target mark per 3-hour examination section (each out of $35n$).
- Feasibility indicators: **Secured!** 🎉, **Comfortable**, **Achievable**, **Demanding (>85%)**, or **Unreachable**.

#### 4. Sessional / Lab Handling
- Lab courses (e.g., ME 244, IPE 206) bypass CTs and continuous attendance, allowing projected or final letter grades and lab notes.

---

### 📚 Module B: Course & Semester Management
- **Hierarchy:** Level-1 Term-1 (L1T1) through Level-4 Term-2 (L4T2).
- **Course Classification:** Theory vs Sessional/Lab, credits (0.75, 1.5, 2.0, 3.0, 4.0), teacher, room, and status.
- **BIIS Grade Sheet Auto-Parser:**
  - Copy tabular text directly from BUET BIIS (`biis.buet.ac.bd`) or drop result sheet screenshots.
  - Automatically parses Course Code, Title, Credits, Grade, and Grade Point.
  - One-click bulk ingestion to semester transcript.

---

### 📊 Module D: Academic Analytics & CGPA Trajectory
1. **CGPA Progression Line Chart:** Semester vs. Term GPA & Cumulative CGPA with Dean's List ($\ge 3.75$) and First Class ($\ge 3.00$) threshold lines.
2. **Current Term CT Performance Chart:** Normalized percentage comparison across all registered theory courses.
3. **Attendance Safety Gauge:** Progress bars per course with 60% Non-collegiate red danger marker and 90% full slab line.
4. **Credit Distribution Donut Chart:** Completed vs Ongoing vs Remaining credits for graduation (out of 160 credits).
5. **Live Projected CGPA Simulator:** Interactive slider to forecast your graduation CGPA based on projected Term GPA!

---

## 🚀 Running the Application

### 1. Web & Desktop Development Server:
```bash
# Run web dev server
npm run dev

# Or run with desktop Electron wrapper
npm run dev:electron
```
The application will open at `http://localhost:5173`.

### 2. Production Build:
```bash
npm run build
```

---

## ⌨️ Desktop Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save / Sync database to offline storage |
| `Ctrl + E` | Switch to Routine Designer & Export |
| `Ctrl + P` | Print Routine (Landscape print layout) |
| `F11` | Toggle Full Screen Mode |

---

## 🏛️ Seed Dataset
Pre-loaded with realistic BUET Level-2 Term-1 IPE batch courses:
- `ME 243`: Mechanics of Solids (3.0 cr, Theory)
- `ME 265`: Thermal Engineering & Heat Transfer (3.0 cr, Theory)
- `IPE 205`: Manufacturing Processes I (3.0 cr, Theory)
- `IPE 207`: Engineering Metallurgy (3.0 cr, Theory)
- `IPE 209`: Engineering Economy (2.0 cr, Theory)
- `ME 244`, `ME 266`, `IPE 206`, `IPE 208`: Sessional Labs (0.75 cr each)
- Completed Level-1 Term-1 and Level-1 Term-2 historical transcripts showing Dean's List progression.
