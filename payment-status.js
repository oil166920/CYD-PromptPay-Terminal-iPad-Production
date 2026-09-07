export default async function handler(req,res){
  res.setHeader("Content-Type","application/json; charset=utf-8");
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const id=String(req.query?.id||"");
  if(!/^pi_[A-Za-z0-9]+$/.test(id))return res.status(400).json({error:"PaymentIntent ID ไม่ถูกต้อง"});
  const sk=process.env.STRIPE_SECRET_KEY;
  if(!sk)return res.status(500).json({error:"ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY ใน Vercel"});
  try{
    const r=await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(id)}`,{headers:{"Authorization":`Bearer ${sk}`,"Accept":"application/json"},cache:"no-store"});
    const d=await r.json();
    if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"Stripe API error"});
    return res.status(200).json({id:d.id,status:d.status,amount:d.amount});
  }catch(e){return res.status(500).json({error:e?.message||"Server error"});}
}
