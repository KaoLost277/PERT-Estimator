---
description: ตรวจสอบและ Refactor CSS/Tailwind classes ที่ซ้ำซ้อนให้เรียกใช้จากที่เดียวกัน
---

1. สแกนหาการใช้ Inline Styles หรือ Tailwind classes ที่ซ้ำกันในหลายๆ Component
2. ตรวจสอบไฟล์ Global CSS หรือ Tailwind config เพื่อดูว่ามี CSS Variables ที่กำหนดไว้แล้วหรือไม่
3. วิเคราะห์ส่วนประกอบ UI ที่มี Pattern เดียวกัน (เช่น Button, Card, Input) แต่ใช้ classes แยกกัน
4. ดำเนินการ Refactor:
    - หากเป็น Tailwind classes ที่ใช้ซ้ำกันมาก ให้พิจารณาสร้างเป็น reusable component หรือใช้ `@apply` ในไฟล์ CSS หลัก (ถ้าจำเป็นจริงๆ)
    - หากมีการใช้สีหรือระยะห่างที่คงที่ (Hardcoded values) ให้เปลี่ยนไปใช้ CSS Variables หรือ Tailwind theme tokens
    - ใช้ `clsx` หรือ `tailwind-merge` เพื่อจัดการ dynamic classes ให้เป็นระเบียบ
5. ทดสอบการแสดงผล (Visual Regression) ว่ายังเหมือนเดิมทุกประการ
6. รายงานสรุปรายการไฟล์ที่ได้รับการ Refactor และวิธีการที่ใช้จัดการความซ้ำซ้อน
