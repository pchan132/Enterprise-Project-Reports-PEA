version: 1.00 API
เพิ่ม CRUD API:
GET /api ดูรายการ พร้อม page, pageSize, q, status, district, requestType
POST /api สร้างคำร้อง และ auto-generate requestNo
GET /api/[id] ดูคำร้องรายตัว ใช้ได้ทั้ง id หรือ requestNo
PUT /api/[id] แก้ไขคำร้อง
DELETE /api/[id] ลบคำร้อง
ไฟล์ที่เพิ่ม/แก้:
app/api/route.ts (line 13)
app/api/[id]/route.ts (line 17)
app/lib/electrical-requests-api.ts (line 67)

---------------------------------------------------------
backend to frontend:
เสร็จแล้วครับ ต่อ frontend เข้ากับ CRUD API จริงครบ flow แล้ว:

ฟอร์มเพิ่มคำร้องใช้ POST /api
ฟอร์มแก้ไขโหลดข้อมูลจาก GET /api/[id] และบันทึกด้วย PUT /api/[id]
หน้า list ดึงจาก GET /api?page=... แทน mock data
ใน list กดที่เลขคำร้องหรือชื่อผู้ยื่นคำร้องแล้วเข้าไปดูรายละเอียดทั้งหมดที่ /requests/[id]
หน้า detail มีปุ่มไปแก้ไขข้อมูลที่ /requests/[id]/edit
เปลี่ยนสถานะจาก list จะยิง PUT /api/[id] จริง
ไฟล์หลักที่เพิ่ม/แก้:
app/components/request-form.tsx, app/components/requests-list.tsx, app/components/request-detail.tsx, app/requests/[id]/page.tsx, app/requests/[id]/edit/page.tsx, app/lib/electrical-request-types.ts

ตรวจแล้วผ่าน:
npm run lint
npx tsc --noEmit
npm run build
และลองเรียก GET /api?page=1&pageSize=1 ได้ 200 OK

เปิด dev server ให้แล้วที่: http://localhost:3000/requests