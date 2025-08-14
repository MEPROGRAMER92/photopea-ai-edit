// i18n
const i18n = {
  en:{title:"AI Edit (Smart)",promptLabel:"Prompt",autoIntent:"Auto‑detect intent (Remove / Replace / Generate)",
      conn:"Connection",endpointLabel:"Server endpoint (Vertex AI)",geminiKey:"Gemini API Key (optional)",
      hint:"Gemini rewrites your prompt; masked editing runs on Vertex Imagen on the server.",
      mask:"Mask",fetch:"Fetch from Photopea",brush:"Brush",erase:"Erase",rect:"Rect mask",clear:"Clear mask",
      paintHint:"Paint or drag a rectangle over the area you want to edit. Painted area = will be edited.",
      run:"Run",openResult:"Open Result in Photopea",how:"How it works",
      howList:["Fetch flattened PNG via saveToOE('png').","Create transparent PNG mask (transparent = edit area).","Infer intent and optionally rewrite with Gemini.","POST to your server → Vertex Imagen inpainting.","Open the PNG result in Photopea."]},
  ar:{title:"تحرير بالذكاء",promptLabel:"النص المطلوب (Prompt)",autoIntent:"تعرّف تلقائي على النية (إزالة / استبدال / إضافة)",
      conn:"الاتصال",endpointLabel:"رابط الخادم (Vertex AI)",geminiKey:"مفتاح Gemini (اختياري)",
      hint:"Gemini لتحسين النص؛ التعديل المقنّع يتم على الخادم عبر Vertex Imagen.",
      mask:"القناع",fetch:"جلب من Photopea",brush:"الفرشاة",erase:"ممحاة",rect:"قناع مستطيل",clear:"مسح القناع",
      paintHint:"لوّن أو اسحب مستطيلاً فوق المنطقة المراد تعديلها. المنطقة الملوّنة = سيتم تعديلها.",
      run:"تشغيل",openResult:"فتح الناتج في Photopea",how:"آلية العمل",
      howList:["جلب PNG مسطّح عبر saveToOE('png').","إنشاء قناع شفاف (الشفاف = منطقة التعديل).","استنتاج النية وتحسين النص عبر Gemini (اختياري).","إرسال الطلب إلى الخادم → Vertex Imagen.","فتح الناتج داخل Photopea."]}
};
const langSel=document.getElementById("langSel");
function setLang(l){const t=i18n[l]||i18n.en;
  document.getElementById("t_title").textContent=t.title;
  document.getElementById("t_promptLabel").textContent=t.promptLabel;
  document.getElementById("t_autoIntent").textContent=t.autoIntent;
  document.getElementById("t_conn").textContent=t.conn;
  document.getElementById("t_endpointLabel").textContent=t.endpointLabel;
  document.getElementById("t_geminiKey").textContent=t.geminiKey;
  document.getElementById("t_hint").textContent=t.hint;
  document.getElementById("t_mask").textContent=t.mask;
  document.getElementById("t_fetch").textContent=t.fetch;
  document.getElementById("t_brush").textContent=t.brush;
  document.getElementById("t_erase").textContent=t.erase;
  document.getElementById("t_rect").textContent=t.rect;
  document.getElementById("t_clear").textContent=t.clear;
  document.getElementById("t_paintHint").textContent=t.paintHint;
  document.getElementById("t_run").textContent=t.run;
  document.getElementById("t_openResult").textContent=t.openResult;
  document.getElementById("t_how").textContent=t.how;
  const ul=document.getElementById("t_howList"); ul.innerHTML="";
  t.howList.forEach(li=>{const el=document.createElement("li"); el.textContent=li; ul.appendChild(el);});
  document.body.classList.toggle("rtl", l==="ar");
}
langSel.addEventListener("change",e=>setLang(e.target.value)); setLang("ar");

// Core
const statusEl=document.getElementById("status"), promptEl=document.getElementById("prompt"), autoIntentEl=document.getElementById("autoIntent");
const serverUrlEl=document.getElementById("serverUrl"), geminiKeyEl=document.getElementById("geminiKey"), intentBadge=document.getElementById("intentBadge");
const imgCanvas=document.getElementById("imgCanvas"), maskCanvas=document.getElementById("maskCanvas");
const brushSizeEl=document.getElementById("brushSize"), eraseEl=document.getElementById("erase");
const fetchBtn=document.getElementById("fetchImage"), clearMaskBtn=document.getElementById("clearMask"), rectToolBtn=document.getElementById("rectTool");
const runBtn=document.getElementById("run"), openResultBtn=document.getElementById("openResult");
const imgCtx=imgCanvas.getContext("2d"), maskCtx=maskCanvas.getContext("2d");
let baseImage=null, basePNGBytes=null, resultPNGBytes=null, currentTool="brush";
function setStatus(t){statusEl.textContent=t;}
function uint8ToBlob(u8,m="image/png"){return new Blob([u8],{type:m});}
function dataURLToUint8(d){const b=atob(d.split(',')[1]); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i); return u;}

function inferIntent(text){const t=(text||"").toLowerCase().trim();
  const rm=["ازالة","إزالة","شيل","احذف","حذف","امسح","مسح","بدون","remove","erase","delete","clean up","clean"];
  const rp=["استبدل","بدّل","بدل","خلي مكانه","ضع مكانه","replace with","replace","change into","swap","turn into"];
  const gn=["أضف","اضف","ضع","انشئ","أنشئ","ارسم","ولد","generate","add","insert","create","paint","draw"];
  const has=a=>a.some(w=>t.includes(w)); let mode="generate";
  if(has(rm)&&!has(rp)&&!has(gn)) mode="remove"; else if(has(rp)) mode="replace"; else if(has(gn)) mode="generate";
  let detail=t; const m1=t.match(/replace\s+(.*?)\s+with\s+(.*)/i); if(m1) detail=m1[2];
  const m2=t.match(/استبدل\s+(.*?)\s+ب(?:ـ|ِ)?\s*(.*)/); if(m2) detail=m2[2];
  detail=(detail||"").replace(/(please|من فضلك|لو سمحت)/gi,"").trim(); return {mode, detail};}
promptEl.addEventListener("input",()=>{ if(!autoIntentEl.checked){intentBadge.textContent="mode: manual"; return;} const {mode}=inferIntent(promptEl.value); intentBadge.textContent="mode: "+mode; });

function resizeCanvasesToImage(img){const w=img.width,h=img.height; imgCanvas.width=w; imgCanvas.height=h; maskCanvas.width=w; maskCanvas.height=h;
  imgCtx.clearRect(0,0,w,h); maskCtx.clearRect(0,0,w,h); imgCtx.drawImage(img,0,0);
  maskCtx.fillStyle="rgba(255,255,255,1)"; maskCtx.fillRect(0,0,w,h);}

let drawing=false, rectStart=null;
maskCanvas.addEventListener("pointerdown",e=>{ if(!baseImage) return; drawing=true; if(currentTool==="rect"){rectStart=getXY(e); previewRect(e);} else paint(e); });
maskCanvas.addEventListener("pointermove",e=>{ if(!drawing||!baseImage) return; if(currentTool==="rect"){ previewRect(e);} else paint(e); });
window.addEventListener("pointerup",()=>{ drawing=false; rectStart=null; });
function getXY(e){const r=maskCanvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*(maskCanvas.width/r.width), y:(e.clientY-r.top)*(maskCanvas.height/r.height)};}
function previewRect(e){ maskCtx.globalCompositeOperation="source-over"; maskCtx.fillStyle="rgba(255,255,255,1)"; maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height);
  const {x,y}=getXY(e); const x0=Math.min(rectStart.x,x), x1=Math.max(rectStart.x,x); const y0=Math.min(rectStart.y,y), y1=Math.max(rectStart.y,y);
  maskCtx.globalCompositeOperation="destination-out"; maskCtx.fillRect(x0,y0,x1-x0,y1-y0); maskCtx.globalCompositeOperation="source-over"; }
function paint(e){const {x,y}=getXY(e); const r=parseInt(brushSizeEl.value,10); maskCtx.globalCompositeOperation=eraseEl.checked?"source-over":"destination-out";
  maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill(); maskCtx.globalCompositeOperation="source-over";}
rectToolBtn.addEventListener("click",()=>{ currentTool=(currentTool==="rect")?"brush":"rect"; rectToolBtn.classList.toggle("primary", currentTool==="rect");});
clearMaskBtn.addEventListener("click",()=>{ if(!baseImage) return; maskCtx.fillStyle="rgba(255,255,255,1)"; maskCtx.fillRect(0,0,maskCanvas.width,maskCanvas.height); });

fetchBtn.addEventListener("click",()=>{ setStatus("Requesting flattened PNG from Photopea ..."); window.parent.postMessage('app.activeDocument.saveToOE("png");',"*"); });
window.addEventListener("message", async (e)=>{
  if(typeof e.data==="string"){ if(e.data==="done") return; console.log("PP:",e.data); return; }
  if(e.data instanceof ArrayBuffer){ basePNGBytes=new Uint8Array(e.data); const blob=uint8ToBlob(basePNGBytes,"image/png"); const img=await createImageBitmap(blob);
    baseImage=img; resizeCanvasesToImage(img); setStatus(`Image received (${img.width}×${img.height}). Create your mask, then Run.`); }
});

function buildMaskPNG(){ const w=maskCanvas.width,h=maskCanvas.height, imgData=maskCtx.getImageData(0,0,w,h);
  const tmp=document.createElement("canvas"); tmp.width=w; tmp.height=h; const tctx=tmp.getContext("2d"); tctx.putImageData(imgData,0,0);
  return dataURLToUint8(tmp.toDataURL("image/png")); }

async function callServer({imageU8,maskU8,prompt,serverUrl,geminiKey}){
  const form=new FormData(); form.append("prompt",prompt);
  form.append("image", new Blob([imageU8],{type:"image/png"}),"image.png");
  form.append("mask",  new Blob([maskU8], {type:"image/png"}),"mask.png");
  const headers={}; if(geminiKey && geminiKey.trim()) headers["x-gemini-key"]=geminiKey.trim();
  const res=await fetch(serverUrl,{method:"POST", body:form, headers}); if(!res.ok) throw new Error("Server error: "+res.status+" "+await res.text());
  const ab=await res.arrayBuffer(); return new Uint8Array(ab);
}

runBtn.addEventListener("click", async ()=>{
  try{
    if(!basePNGBytes){ setStatus("Fetch image first."); return; }
    if(!serverUrlEl.value.trim()){ setStatus("Provide server endpoint first."); return; }
    const {mode,detail}=autoIntentEl.checked?inferIntent(promptEl.value):{mode:"generate",detail:promptEl.value.trim()};
    intentBadge.textContent="mode: "+mode;
    let finalPrompt=detail||promptEl.value.trim();
    if(mode==="remove") finalPrompt="Remove selected content, fill naturally with matching background, lighting and perspective. "+finalPrompt;
    if(mode==="replace") finalPrompt="Replace selected content with: "+finalPrompt+". Match lighting, shadow and perspective. No artifacts.";
    if(mode==="generate") finalPrompt="Generate realistic content in the selected area: "+finalPrompt+". Blend smoothly with the context, correct lighting/shadows.";
    const maskU8=buildMaskPNG(); setStatus("Sending to server ...");
    const outU8=await callServer({ imageU8:basePNGBytes, maskU8, prompt:finalPrompt, serverUrl:serverUrlEl.value.trim(), geminiKey:geminiKeyEl.value });
    resultPNGBytes=outU8; setStatus("Done. Opening result in Photopea ..."); window.parent.postMessage(outU8.buffer,"*");
  }catch(err){ console.error(err); setStatus("Error: "+err.message); }
});
openResultBtn.addEventListener("click",()=>{ if(!resultPNGBytes){ setStatus("No result yet."); return;} window.parent.postMessage(resultPNGBytes.buffer,"*"); });
