# CYD PromptPay Terminal — iPad / Vercel Production Edition

เว็บรับเงิน PromptPay สำหรับ iPad Safari โดยไม่ต้องใช้ ESP32, CYD, USB หรืออุปกรณ์เสริม

## Flow

1. ผู้ใช้ใส่ยอดเงิน
2. `/api/create-payment` สร้างและ confirm Stripe PaymentIntent ด้วย `promptpay`
3. Stripe ส่ง `next_action.promptpay_display_qr_code.data` กลับมา
4. หน้าเว็บสร้าง QR และแสดงบน iPad
5. หน้าเว็บถาม `/api/payment-status` ทุก 5 วินาทีเพื่อแสดงผลแบบ real-time-ish
6. เมื่อ Stripe ระบุ `succeeded` จะแสดง "ชำระเงินสำเร็จ"

Stripe ระบุว่า PromptPay PaymentIntent มี raw QR payload ใน `next_action.promptpay_display_qr_code.data` และ PaymentIntent จะเปลี่ยนเป็น `succeeded` เมื่อชำระสำเร็จ

## Vercel

ไม่ต้องมี `vercel.json` สำหรับโปรเจกต์นี้ Vercel จะตรวจจับ Node.js Functions ใน `/api` อัตโนมัติ

`package.json` กำหนด Node.js `24.x` ซึ่งเป็นรุ่นที่เหมาะกับการ deploy ใหม่ในปัจจุบัน

ตั้ง Environment Variable เพียงตัวเดียว:

- `STRIPE_SECRET_KEY` = Stripe Secret/Restricted key ที่มีสิทธิ์สร้างและอ่าน PaymentIntents

ใช้ `sk_test_...` ก่อนทดสอบ แล้วจึงเปลี่ยนเป็น `sk_live_...` เมื่อพร้อมรับเงินจริง

## Health check

หลัง deploy เปิด:

`https://YOUR-DOMAIN.vercel.app/api/health`

ควรได้ JSON ที่มี `ok: true` และ `stripeConfigured: true`

## สำคัญเรื่องการตรวจเงิน

ตัว UI ใช้การ polling PaymentIntent เพื่อรู้ว่าจ่ายสำเร็จแล้ว ซึ่งเหมาะกับหน้าจอ terminal แต่ Stripe แนะนำ webhook สำหรับ logic สำคัญ เช่น การปล่อยสินค้า/บริการ เพราะ polling มีความเสี่ยงด้าน rate limit และความน่าเชื่อถือน้อยกว่า webhook

ถ้าจะนำระบบไปผูกกับการส่งสินค้า/ตัดสต็อก/บันทึกยอดขายจริง ควรเพิ่ม webhook `payment_intent.succeeded` และตรวจลายเซ็น `Stripe-Signature` ก่อนดำเนินการ

## ความปลอดภัย

ห้ามใส่ Secret Key ใน HTML, app.js หรือไฟล์ frontend ทุกกรณี
