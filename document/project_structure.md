# โครงสร้างโปรเจกต์ PERT Estimator

เอกสารนี้รวบรวมข้อมูลเกี่ยวกับโครงสร้างของแอปพลิเคชัน PERT Estimator ทั้งในส่วนของสถาปัตยกรรมทางเทคนิค และแนวทางการพัฒนาล่าสุด เพื่อให้เห็นภาพรวมและรายละเอียดการทำงานของระบบอย่างครบถ้วน

---

## 1. ภาพรวมโครงการ (Project Overview)

**PERT Estimator** เป็นเครื่องมือช่วยบริหารจัดการโครงการที่ใช้เทคนิค **Program Evaluation and Review Technique (PERT)** เพื่อประเมินระยะเวลาการทำงานที่แม่นยำขึ้น โดยใช้การประเมิน 3 ค่า (Optimistic, Most Likely, Pessimistic) ร่วมกับการคำนวณทางสถิติและการวิเคราะห์ **Critical Path Method (CPM)**

**เป้าหมายหลัก:**
- ลดความคลาดเคลื่อนในการประเมินเวลาของโปรเจกต์ไอที
- วิเคราะห์ความเสี่ยงและโอกาสที่งานจะเสร็จทันเวลาด้วยสถิติ Normal Distribution
- แสดงผลแผนงานในรูปแบบ Visual (Gantt Chart, Execution Board และ Risk Profile)

---

## 2. เทคโนโลยีที่ใช้งาน (Tech Stack)

- **Frontend:** Next.js 15+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS 4 (ใช้วิธี Vanilla CSS Variables ร่วมกับ Utility Classes)
- **State Management:** React Context API (`/lib/store.tsx`)
- **Data Persistence:** LocalStorage (Sync ผ่าน Effect ใน Store)
- **Charts/Visuals:** Recharts (Bell Curve, Performance & Risk Charts)
- **Icons:** Lucide React
- **Testing:** Vitest (สำหรับการทดสอบ Calculation Logic)
- **PDF/Excel:** jsPDF, XLSX

---

## 3. สถาปัตยกรรมระบบ (Architecture)

### 3.1 การจัดการสถานะ (State Management)
ระบบใช้ **ProjectProvider** เป็นศูนย์กลางข้อมูล:
1.  **Context API:** จัดเก็บ `projects`, `activeProject`, และ `language`
2.  **Auto-Sync:** บันทึกข้อมูลลง `pert-projects` ใน LocalStorage ทุกครั้งที่มีการเปลี่ยนแปลง
3.  **Project Operations:** รองรับ Create, Rename, Delete, Duplicate และ Flatten Tasks สำหรับการคำนวณ

### 3.2 เครื่องมือคำนวณ (Calculation Engine)
Logic หลักอยู่ที่ `/lib/calculations.ts` และ `/lib/logic.ts`:
-   **PERT Formulas:** คำนวณ TE ($ (O+4M+P)/6 $) และ SD ($ (P-O)/6 $)
-   **Statistical Analysis:** Z-Score Probability และ Normal Distribution CDF
-   **CPM & Scheduling:** คำนวณเส้นทางวิกฤต (Critical Path) และสร้างตารางเวลา (Planned Start/End) อัตโนมัติ

---

## 4. โครงสร้างโฟลเดอร์ (Directory Structure)

### `/app`
- `globals.css`: ควบคุม Design System (Colors, Fonts: Prompt, IBM Plex Sans Thai, Inter)
- `layout.tsx`: จุดรวม Provider (Theme, Project)
- `page.tsx`: หน้า Dashboard หลักที่รวมทุก Dashboard Widgets

### `/components` (UI Elements)
- **Task Management:** `TaskMatrix.tsx` (Grid view), `TaskCardView.tsx` (Card view), `AddTaskCard.tsx`
- **Dashboards:** `AnalyticsDashboard.tsx`, `SummaryStats.tsx`, `ExecutionBoard.tsx` (Kanban style)
- **Charts:** `RiskChart.tsx`, `GanttChart.tsx`, `PerformanceChart.tsx`
- **Utilities:** `ThemeProvider.tsx`, `ThemeToggle.tsx`, `Tooltip.tsx`

### `/lib` (Business Logic)
- `store.tsx`: Core State, Interfaces (`Task`, `Project`) และ LocalStorage logic
- `calculations.ts`: ฟังก์ชันสถิติและการคำนวณ PERT/CPM
- `exportUtils.ts`: ระบบส่งออกไฟล์ Excel และ PDF
- `i18n.ts`: ระบบจัดการ 2 ภาษา (TH/EN)
- `utils.ts`: Tailwind configuration และ helper functions

---

## 5. ฟีเจอร์หลัก (Main Features)

1.  **Multi-Mode Estimation:** รองรับทั้งแบบ PERT (3 ค่า) และ Single-Point (1 ค่า)
2.  **Interactive Gantt Chart:** แสดง Timeline ของงานพร้อมเส้นทางวิกฤต
3.  **Execution Board:** จัดการสถานะงาน (TODO, IN_PROGRESS, DONE) แบบ Drag-and-Drop
4.  **Risk Profile Analysis:** แสดงกราฟระฆังคว่ำเพื่อประเมินโอกาสสำเร็จ (Confidence Level)
5.  **Multi-Language UI:** รองรับภาษาไทยและอังกฤษอย่างสมบูรณ์
6.  **PDF Report:** สร้างรายงานภาพรวมโครงการที่สวยงามสำหรับการนำเสนอ

---

## 6. เวิร์กโฟลว์อัตโนมัติ (Automated Workflows)

ระบบรองรับคำสั่ง Slash Commands เพื่อช่วยในการพัฒนา:
1.  **/check-standard**: ตรวจสอบมาตรฐานโค้ด (Lint, Test, Build)
2.  **/update-docs**: อัปเดตไฟล์โครงสร้างโปรเจกต์และคู่มือการใช้งานอัตโนมัติ
3.  **/check-logic**: ตรวจสอบความถูกต้องของ Business Logic และแก้ไขข้อผิดพลาดอัตโนมัติ
4.  **/write-test**: สร้าง Unit Test สำหรับฟังก์ชันการคำนวณหรือฟีเจอร์ใหม่

---

## 7. ระบบแจ้งเตือนงานล่าช้า (Delay Tracking)
ระบบมีตรรกะการตรวจสอบความล่าช้าที่ชาญฉลาด (Smart Delay Detection):
- **การนับงาน (Leaf Task Counting):** ระบบจะนับจำนวนงานจริงที่ต้องปฏิบัติ (งานย่อย) ไม่นับซ้ำที่ชื่อกลุ่มงาน
- **การสืบทอดความล่าช้า (Parental Delay):** หากคุณตั้งวันที่ล่าช้าไว้ที่ "กลุ่มงาน" งานย่อยทั้งหมดที่ยังไม่เสร็จในกลุ่มนั้นจะถูกนับเป็น "ล่าช้า" โดยอัตโนมัติ
- **Smart Filter:** งานที่เช็คถูก (**DONE**) แล้ว จะไม่ถูกนำมารวมในยอดความล่าช้า แม้ว่าวันที่ตามแผนจะผ่านไปแล้วก็ตาม
- **Date Validation:** ระบบจะแสดง Badge **"วันที่ผิดพลาด" (DATE ERROR)** หากมีการระบุวันที่สิ้นสุดก่อนวันที่เริ่มต้น

---
*ปรับปรุงล่าสุด: 15 มีนาคม 2026*
