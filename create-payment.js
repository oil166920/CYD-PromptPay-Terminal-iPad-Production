export default async function handler(req,res){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  try{
    const {amount}=req.body||{};
    if(!Number.isInteger(amount)||amount<1000||amount>99999999)return res.status(400).json({error:"ยอดเงินไม่ถูกต้อง (ขั้นต่ำ 10 บาท)"});
    const sk=process.env.STRIPE_SECRET_KEY;
    if(!sk)return res.status(500).json({error:"ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY ใน Vercel"});
    const body=new URLSearchParams();
    body.set("amount",String(amount));
    body.set("currency","thb");
    body.append("payment_method_types[]","promptpay");
    body.set("payment_method_data[type]","promptpay");
    const email=process.env.PROMPTPAY_EMAIL;
    if(email)body.set("payment_method_data[billing_details][email]",email);
    body.set("confirm","true");
    const r=await fetch("https://api.stripe.com/v1/payment_intents",{method:"POST",headers:{"Authorization":`Bearer ${sk}`,"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},body});
    const d=await r.json();
    if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"Stripe API error",code:d?.error?.code||null});
    const qr=d?.next_action?.promptpay_display_qr_code?.data;
    if(typeof qr!=="string"||!qr.trim())return res.status(502).json({error:"Stripe สร้าง PaymentIntent แล้ว แต่ไม่ได้ส่ง PromptPay QR กลับมา",status:d.status});
    return res.status(200).json({id:d.id,amount:d.amount,qr,status:d.status});
  }catch(e){return res.status(500).json({error:e?.message||"Server error"});}
}
