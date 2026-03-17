---
description: ตรวจสอบ Business Logic และความถูกต้องของระบบ พร้อมรายงานผลในโฟลเดอร์ document
---

1. วิเคราะห์ Business Logic จาก [project_structure.md](file:///f:/pert/document/project_structure.md) และ [userManual.md](file:///f:/pert/document/userManual.md)
2. ตรวจสอบโค้ดใน `lib/calculations.ts` และ `lib/logic.ts` ว่าตรงตามเงื่อนไขที่ผู้ใช้ต้องการหรือไม่
3. สร้างหรืออัปเดตไฟล์ Unit Test (`.test.ts`) เพื่อทดสอบความถูกต้องของคำนวณสถิติและเงื่อนไขต่างๆ
4. // turbo
5. รันคำสั่งตรวจสอบภาพรวม: `npm run test`, `npm run lint`, และ `npm run build`
6. หากพบ Bug, ข้อผิดพลาดของ Logic หรือ Error จากการรันคำสั่ง ให้ดำเนินการ "แก้ไขโค้ด" ทันทีจนกว่าระบบจะทำงานถูกต้องและผ่านทุกการทดสอบ
7. สรุปผลการดำเนินงานและการแก้ไขลงในไฟล์ [F:\pert\document\business_logic_report.md](file:///f:/pert/document/business_logic_report.md) โดยต้องระบุ:
    - หัวข้อที่ทดสอบ (Test Scenarios)
    - สถานะการผ่าน (Passed/Failed)
    - รายการ Bug ที่ตรวจพบและสิ่งที่แก้ไขไป (Bugs Fixed)
8. แจ้งผู้ใช้เมื่อดำเนินการอัปเดตรายงานและแก้ไขระบบเรียบร้อยแล้ว
