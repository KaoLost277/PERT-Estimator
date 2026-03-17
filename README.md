# 📊 PERT Estimator

**PERT Estimator** เป็นเครื่องมือบริหารจัดการโครงการมืออาชีพที่ใช้เทคนิค **Program Evaluation and Review Technique (PERT)** และ **Critical Path Method (CPM)** เพื่อการประมาณการระยะเวลาที่แม่นยำและการวิเคราะห์ความเสี่ยงที่จับต้องได้

---

## 🚀 System Overview

แอปพลิเคชันนี้ถูกออกแบบมาเพื่อช่วยให้โปรเจกต์ไอทีและงานบริหารจัดการมีความแม่นยำสูงขึ้น โดยวิเคราะห์จากข้อมูลการประเมิน 3 ค่า (Optimistic, Most Likely, Pessimistic) เพื่อสร้างแผนงานที่มีความเสี่ยงต่ำที่สุด

### Key Features
-   **Multi-Mode Estimation:** เลือกใช้การประเมินแบบ PERT (3 ค่า) หรือ Single-Point (1 ค่า) ตามความเหมาะสมของงาน
-   **Interactive Gantt Chart:** แสดง Timeline ของโครงการ พร้อมระบบคำนวณวันเริ่ม-จบอัตโนมัติ และไฮไลท์ **เส้นทางวิกฤต (Critical Path)**
-   **Execution Board:** จัดการสถานะงาน (TODO, PROGRESS, DONE) รูปแบบ Kanban พร้อมระบบลากและวาง (Drag-and-Drop)
-   **Risk Profile Analysis:** กราฟสถิติระฆังคว่ำ (Normal Distribution) แสดงโอกาสสำเร็จของโครงการที่ระดับความเชื่อมั่นต่างๆ (Z-Score)
-   **Smart Delay Tracking:** ระบบแจ้งเตือนงานล่าช้าที่คำนวณจากลำดับชั้นของงาน (Hierarchical) และตรวจสอบความถูกต้องของวันที่อัตโนมัติ
-   **Multi-Language UI:** รองรับการทำงานทั้งภาษาไทย และภาษาอังกฤษอย่างสมบูรณ์
-   **Professional Export:** ส่งออกรายงานในรูปแบบ PDF ที่สวยงามหรือไฟล์ Excel สำหรับงานข้อมูล

### Technical Stack
-   **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) (Vanilla CSS Variables & Utility Classes)
-   **Visuals:** [Recharts](https://recharts.org/) & [Lucide React](https://lucide.dev/)
-   **Logic & Math:** Customized PERT/CPM Engine with [Vitest](https://vitest.dev/) for Integrity Testing
-   **Data Storage:** LocalStorage (Offline-first approach)

---

## 🛠️ วิธีติดตั้ง (Installation)

ทำตามขั้นตอนด้านล่างเพื่อเริ่มใช้งานบนเครื่องของคุณ:

### 1. ติดตั้ง Dependencies
ใช้ `npm` เพื่อติดตั้งไลบรารีที่จำเป็นทั้งหมด:
```bash
npm install
```

### 2. เริ่มต้นรันโปรเจกต์ (Development)
รันเซิร์ฟเวอร์สำหรับการพัฒนา:
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### 3. การสร้างไฟล์สำหรับ Production (Build)
เมื่อต้องการนำไปใช้งานจริง:
```bash
npm run build
npm run start
```

---

## 🧪 การทดสอบและควบคุมคุณภาพ

เพื่อให้แน่ใจว่าการคำนวณทางสถิติถูกต้อง 100% คุณสามารถรันการทดสอบได้ดังนี้:

-   **Run Unit Tests:** `npm run test` (ทดสอบ Business Logic และ PERT Calculations)
-   **Linting:** `npm run lint` (ตรวจสอบมาตรฐานโค้ด)

---

## 📂 Project Structure

-   `/app`: หน้าหลักของแอปพลิเคชันและ Configuration
-   `/components`: ส่วนประกอบ UI (Gantt, Board, Charts, Tasks)
-   `/lib`: หัวใจสำคัญของระบบ (State Management, PERT/CPM Logic, Exports)
-   `/document`: เอกสารรายละเอียดทางเทคนิคและคู่มือการใช้งาน

---
*Created with ❤️ for Project Managers and Developers.*
