export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const configured=Boolean(process.env.STRIPE_SECRET_KEY);
  return res.status(configured?200:503).json({ok:configured,service:"promptpay-terminal",stripeConfigured:configured,node:process.version});
}
