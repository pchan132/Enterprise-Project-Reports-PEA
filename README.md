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