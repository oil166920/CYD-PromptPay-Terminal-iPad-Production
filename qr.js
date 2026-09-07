const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const { promptpayId, amount } = req.body || {};
    const id = String(promptpayId || '').replace(/[-\s]/g, '');
    const n = Number(amount);
    if (!/^\d{10}$|^\d{13}$|^\d{15}$/.test(id)) {
      return res.status(400).json({ ok:false, error:'เลขพร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก, เลขบัตรประชาชน/Tax ID 13 หลัก หรือ e-Wallet 15 หลัก' });
    }
    if (!Number.isFinite(n) || n <= 0 || n > 999999999.99) {
      return res.status(400).json({ ok:false, error:'จำนวนเงินไม่ถูกต้อง' });
    }
    const payload = generatePayload(id, { amount: Number(n.toFixed(2)) });
    const dataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel:'M', margin:2, width:560 });
    return res.status(200).json({ ok:true, promptpayId:id, amount:Number(n.toFixed(2)), payload, qr:dataUrl });
  } catch (e) {
    return res.status(500).json({ ok:false, error:e?.message || 'สร้าง QR ไม่สำเร็จ' });
  }
};
