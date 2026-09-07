const state={amount:"10",paymentIntentId:null,startedAt:null,timer:null,poll:null};
const $=s=>document.querySelector(s);
const views=["amountView","loadingView","qrView","paidView","errorView"];
function show(id){views.forEach(v=>$("#"+v).classList.toggle("active",v===id));}
function money(n){return Number(n).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});}
function renderAmount(){$("#amountDisplay").textContent=state.amount||"0.00";}
function setError(e){$("#errorText").textContent=e?.message||"ไม่สามารถสร้างรายการได้";show("errorView");}
function validAmount(){const n=Number(state.amount);return Number.isFinite(n)&&Math.round(n*100)>=1000;}
function key(k){
  if(k==="back"){state.amount=state.amount.slice(0,-1);if(!state.amount)state.amount="0";}
  else if(k==="."&&!state.amount.includes(".")) state.amount+=".";
  else if(k!=="."){
    if(state.amount==="0")state.amount=k;
    else if(state.amount.length<9)state.amount+=k;
    const parts=state.amount.split("."); if(parts[1]?.length>2)state.amount=parts[0]+"."+parts[1].slice(0,2);
  }
  renderAmount();
}
async function createPayment(){
  if(!validAmount()){setError(new Error("ยอดขั้นต่ำ 10.00 บาท"));return}
  show("loadingView");
  try{
    const r=await fetch("/api/create-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:Math.round(Number(state.amount)*100)})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"Stripe ไม่สามารถสร้างรายการได้");
    state.paymentIntentId=data.id; state.startedAt=Date.now();
    $("#qrAmount").textContent=money(data.amount/100)+" บาท";
    $("#timer").textContent="00:00";
    await QRCode.toCanvas($("#qrCanvas"),data.qr,{errorCorrectionLevel:"M",margin:2,width:500,color:{dark:"#000000",light:"#ffffff"}});
    show("qrView"); startPolling();
  }catch(e){setError(e)}
}
function startPolling(){
  clearInterval(state.poll); clearInterval(state.timer);
  state.poll=setInterval(checkStatus,5000); state.timer=setInterval(()=>{
    const sec=Math.floor((Date.now()-state.startedAt)/1000),m=String(Math.floor(sec/60)).padStart(2,"0"),s=String(sec%60).padStart(2,"0");
    $("#timer").textContent=`${m}:${s}`;
  },1000); checkStatus();
}
async function checkStatus(){
  if(!state.paymentIntentId)return;
  try{
    const r=await fetch("/api/payment-status?id="+encodeURIComponent(state.paymentIntentId),{cache:"no-store"});
    const d=await r.json(); if(!r.ok)throw new Error(d.error||"ตรวจสอบสถานะไม่ได้");
    if(d.status==="succeeded"){
      clearInterval(state.poll);clearInterval(state.timer);
      $("#paidAmount").textContent=money(Number(state.amount))+" บาท"; show("paidView"); navigator.vibrate?.([80,50,80]);
    }else if(["canceled","requires_payment_method"].includes(d.status)){
      clearInterval(state.poll);clearInterval(state.timer);setError(new Error("รายการชำระเงินหมดอายุหรือถูกยกเลิก"));
    }
  }catch(e){console.warn(e)}
}
function reset(){clearInterval(state.poll);clearInterval(state.timer);state.paymentIntentId=null;state.amount="10";renderAmount();show("amountView")}
document.querySelectorAll("[data-key]").forEach(b=>b.addEventListener("click",()=>key(b.dataset.key)));
document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{state.amount=String(Number(state.amount||0)+Number(b.dataset.add));renderAmount()}));
$("#clearBtn").onclick=()=>{state.amount="10";renderAmount()};
$("#payBtn").onclick=createPayment;
$("#cancelBtn").onclick=reset;$("#restartBtn").onclick=reset;$("#retryBtn").onclick=()=>show("amountView");
renderAmount();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
