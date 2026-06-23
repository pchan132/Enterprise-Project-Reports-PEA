# ส่งรายงานสรุปคำร้องเข้า LINE Group จาก Dashboard

เพิ่มฟีเจอร์ให้ผู้ใช้สามารถกดปุ่ม "ส่งรายงานคำร้องเข้า LINE" จากหน้า Dashboard เพื่อส่งสรุปรายการคำร้องเข้า LINE Group ตามสถานะและช่วงวันที่ที่เลือก โดยมีการจัดการข้อจำกัดของ LINE Messaging API อย่างมีประสิทธิภาพ เพื่อป้องกันข้อผิดพลาดและประหยัดโควต้า

## User Review Required

> [!IMPORTANT]
> - ระบบนี้จะส่งข้อความแจ้งเตือนเข้า LINE Group ที่ถูกตั้งค่าไว้ใน Environment Variables (`LINE_GROUP_ID` และ `LINE_CHANNEL_ACCESS_TOKEN`) รบกวนยืนยันว่าได้มีการตั้งค่าเหล่านี้เรียบร้อยแล้ว
> - ข้อมูลที่สรุปจะถูกส่งรวมใน Request เดียวสูงสุด 5 กล่องข้อความ (Bubble) เพื่อประหยัดโควต้าตามข้อกำหนดของ LINE

## Open Questions

ไม่มีคำถามเพิ่มเติมในส่วนนี้ หากแผนการทำงานถูกต้องสามารถกด Approve ได้เลยครับ

## Proposed Changes

---

### Dashboard Frontend
เพิ่มปุ่มและ Modal สำหรับเลือกเงื่อนไขการส่งรายงาน

#### [MODIFY] [page.tsx](file:///e:/MyWeb/reportEletical/report-electical/app/dashboard/page.tsx)
- เพิ่มปุ่ม "ส่งรายงานคำร้องเข้า LINE" ที่ส่วน Header ติดกับปุ่ม Refresh
- เพิ่ม State ควบคุมการเปิดปิด Modal

#### [NEW] [line-report-modal.tsx](file:///e:/MyWeb/reportEletical/report-electical/app/components/line-report-modal.tsx)
- สร้าง Client Component สำหรับ Modal ประกอบด้วย:
  - Dropdown เลือกสถานะ (ดึงรายการสถานะจากค่าที่มีในระบบ)
  - Date Picker (เลือกช่วงวันที่ วันเริ่มต้น - วันสิ้นสุด) (Optional)
  - ปุ่มกดยืนยันการส่งรายงาน
- การจัดการ State ระหว่างโหลดและการแสดง Toast แจ้งเตือนเมื่อสำเร็จหรือเกิดข้อผิดพลาด

---

### Backend API & Chunking Logic
สร้าง API Route ใหม่เพื่อคิวรี่ข้อมูล จัดฟอร์แมต และจัดการ Chunking Logic

#### [NEW] [route.ts](file:///e:/MyWeb/reportEletical/report-electical/app/api/dashboard/line-report/route.ts)
- รับพารามิเตอร์ `status`, `startDate`, `endDate` ผ่าน HTTP POST
- ใช้ Prisma Query ดึงข้อมูล `ElectricalRequest` ที่ตรงกับเงื่อนไข
- วนลูปและสร้างข้อความตาม Template ตัวอักษรที่ระบุเป๊ะๆ (รวมส่วน Header ในกล่องข้อความแรก)
- **ระบบแบ่งข้อความ (Chunking Logic):**
  - ตรวจสอบความยาวข้อความ หากสะสมแล้วเกิน 4500 ตัวอักษร ให้แยกกล่องข้อความ (Bubble) ใหม่
  - แบ่ง Array ของข้อความออกเป็นชุดย่อย ชุดละ 5 กล่อง (Elements)
  - วนลูปยิง LINE Messaging API Push Message ทีละชุด (Request ละไม่เกิน 5 Elements) เพื่อประหยัดโควต้าและไม่ให้ผิดกฎของ API

#### [MODIFY] [line-notify.ts](file:///e:/MyWeb/reportEletical/report-electical/app/lib/line-notify.ts)
- เพิ่ม/ปรับปรุงฟังก์ชันสนับสนุน เช่น `formatThaiDate` (หากต้องการปรับปรุง)
- อาจจะเพิ่มฟังก์ชัน `sendLineBulkNotification` หรือเก็บไว้ใน `route.ts` โดยตรง (ตามความเหมาะสม)

## Verification Plan

### Automated Tests
- ตรวจสอบ Type Checker `npm run lint` และ `tsc --noEmit` หลังจากการปรับแก้

### Manual Verification
1. เปิดหน้า Dashboard และกดปุ่ม "ส่งรายงานคำร้องเข้า LINE"
2. เลือกสถานะที่มีจำนวนรายการมากกว่า 10 รายการ (เพื่อทดสอบการแบ่ง 5 กล่อง/ชุด และ 4500 ตัวอักษร)
3. ยืนยันว่า LINE OA ส่งข้อความเข้ามาใน Group ครบถ้วน ถูกต้องตาม Template และไม่เกิด Error 400
4. ทดสอบส่งกรณีที่เลือกวันที่และไม่เลือกวันที่ ว่าข้อมูลที่กรองมาถูกต้องหรือไม่
