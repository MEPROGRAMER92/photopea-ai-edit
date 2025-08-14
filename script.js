const statusEl = document.getElementById("status");
const promptEl = document.getElementById("prompt");
const autoIntentEl = document.getElementById("autoIntent");
const serverUrlEl = document.getElementById("serverUrl");
const apiKeyEl = document.getElementById("apiKey");
const intentBadge = document.getElementById("intentBadge");

const imgCanvas = document.getElementById("imgCanvas");
const maskCanvas = document.getElementById("maskCanvas");
const brushSizeEl = document.getElementById("brushSize");
const eraseEl = document.getElementById("erase");
const fetchBtn = document.getElementById("fetchImage");
const clearMaskBtn = document.getElementById("clearMask");
const runBtn = document.getElementById("run");
const openResultBtn = document.getElementById("openResult");

const imgCtx = imgCanvas.getContext("2d");
const maskCtx = maskCanvas.getContext("2d");

let baseImage = null;
let basePNGBytes = null;
let resultPNGBytes = null;

function setStatus(t){ statusEl.textContent = t; }
function uint8ToBlob(u8, mime="image/png"){ return new Blob([u8], {type:mime}); }
function dataURLToUint8(dataURL){
  const bin = atob(dataURL.split(',')[1]); 
  const u8 = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  return u8;
}

// ==== Intent Detection ====
function inferIntent(text){
  const t = (text||"").toLowerCase().trim();
  const removeWords = ["ازالة","إزالة","شيل","احذف","حذف","امسح","مسح","بدون","remove","erase","delete","clean up","clean"];
  const replaceWords = ["استبدل","بدّل","بدل","خلي مكانه","ضع مكانه","replace with","replace","change into","swap","turn into"];
  const generateWords = ["أضف","اضف","ضع","انشئ","أنشئ","ارسم","ولد","generate","add","insert","create","paint","draw"];
  const has = (arr)=>arr.some(w=>t.includes(w));
  let mode = "generate";
  if (has(removeWords) && !has(replaceWords) && !has(generateWords)) mode = "remove";
  else if (has(replaceWords)) mode = "replace";
  else if (has(generateWords)) mode = "generate";

  let detail = t;
  const m1 = t.match(/replace\s+(.*?)\s+with\s+(.*)/i);
  if (m1) detail = m1[2];
  const m2 = t.match(/استبدل\s+(.*?)\s+ب(?:ـ|ِ)?\s*(.*)/);
  if (m2) detail = m2[2];
  detail = (detail||"").replace(/(please|من فضلك|لو سمحت)/gi,"").trim();
  return { mode, detail };
}

promptEl.addEventListener("input", ()=>{
  if (!autoIntentEl.checked) { intentBadge.textContent="mode: manual"; return; }
  const {mode} = inferIntent(promptEl.value);
  intentBadge.textContent = "mode: " + mode;
});

// ==== Canvas & Mask ====
function resizeCanvasesToImage(img){
  const w = img.width, h = img.height;
  imgCanvas.width = w; imgCanvas.height = h;
  maskCanvas.width = w; maskCanvas.height = h;
  imgCtx.clearRect(0,0,w,h);
  maskCtx.clearRect(0,0,w,h);
  imgCtx.drawImage(img, 0, 0);
  // Opaque white base mask; we paint transparent holes (editable area)
  maskCtx.fillStyle = "rgba(255,255,255,1)";
  maskCtx.fillRect(0,0,w,h);
}

let drawing=false;
maskCanvas.addEventListener("pointerdown", e=>{ drawing=true; paint(e); });
maskCanvas.addEventListener("pointermove", e=>{ if(drawing) paint(e); });
window.addEventListener("pointerup", ()=> drawing=false);

function paint(e){
  const rect = maskCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (maskCanvas.width/rect.width);
  const y = (e.clientY - rect.top ) * (maskCanvas.height/rect.height);
  const r = parseInt(brushSizeEl.value,10);
  maskCtx.globalCompositeOperation = eraseEl.checked ? "source-over" : "destination-out";
  maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill();
  maskCtx.globalCompositeOperation = "source-over";
}

clearMaskBtn.addEventListener("click", ()=>{
  if (!baseImage) return;
  maskCtx.fillStyle = "rgba(255,255,255,1)";
  maskCtx.fillRect(0,0,maskCanvas.width, maskCanvas.height);
});

// ==== Fetch image from Photopea ====
fetchBtn.addEventListener("click", ()=>{
  setStatus("Requesting flattened PNG from Photopea ...");
  window.parent.postMessage('app.activeDocument.saveToOE("png");', "*");
});

window.addEventListener("message", async (e)=>{
  if (typeof e.data === "string"){ if (e.data === "done") return; console.log("PP:", e.data); return; }
  if (e.data instanceof ArrayBuffer){
    basePNGBytes = new Uint8Array(e.data);
    const blob = uint8ToBlob(basePNGBytes, "image/png");
    const img = await createImageBitmap(blob);
    baseImage = img;
    resizeCanvasesToImage(img);
    setStatus("Image received ("+img.width+"×"+img.height+"). Paint your mask, then Run.");
  }
});

function buildMaskPNG(){
  const w = maskCanvas.width, h = maskCanvas.height;
  const imgData = maskCtx.getImageData(0,0,w,h);
  const tmp = document.createElement("canvas"); tmp.width=w; tmp.height=h;
  const tctx = tmp.getContext("2d"); tctx.putImageData(imgData,0,0);
  const dataURL = tmp.toDataURL("image/png");
  return dataURLToUint8(dataURL);
}

async function callOpenAIEdit({imageU8, maskU8, prompt, apiKey}){
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", new Blob([imageU8], {type:"image/png"}), "image.png");
  form.append("mask",  new Blob([maskU8],  {type:"image/png"}), "mask.png");
  form.append("prompt", prompt);
  form.append("n", "1");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method:"POST",
    headers:{ "Authorization":"Bearer "+apiKey },
    body: form
  });
  if(!res.ok) throw new Error("OpenAI error: "+res.status+" "+await res.text());
  const data = await res.json();
  const b64 = data.data[0].b64_json;
  return Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
}

async function callServerless({imageU8, maskU8, prompt, serverUrl}){
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("image", new Blob([imageU8], {type:"image/png"}), "image.png");
  form.append("mask",  new Blob([maskU8],  {type:"image/png"}), "mask.png");
  const res = await fetch(serverUrl, { method:"POST", body: form });
  if(!res.ok) throw new Error("Serverless error: "+res.status+" "+await res.text());
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

runBtn.addEventListener("click", async ()=>{
  try{
    if(!basePNGBytes){ setStatus("Fetch image first."); return; }
    const {mode, detail} = autoIntentEl.checked ? inferIntent(promptEl.value) : {mode:"generate", detail:promptEl.value.trim()};
    intentBadge.textContent = "mode: " + mode;
    let finalPrompt = detail || promptEl.value.trim();
    if (mode === "remove") finalPrompt = "Remove selected content, fill naturally, seamless background, correct lighting and perspective. " + finalPrompt;
    if (mode === "replace") finalPrompt = "Replace selected content with: " + finalPrompt + ". Match lighting, shadows, and perspective, no artifacts.";
    if (mode === "generate") finalPrompt = "Generate realistic content in the selected area: " + finalPrompt + ". Blend with context, correct lighting / shadows.";

    const maskU8 = buildMaskPNG();
    setStatus("Calling AI ("+mode+") ...");
    let outU8;
    if (serverUrlEl.value.trim()){
      outU8 = await callServerless({ imageU8: basePNGBytes, maskU8, prompt: finalPrompt, serverUrl: serverUrlEl.value.trim() });
    } else if (apiKeyEl.value.trim()){
      outU8 = await callOpenAIEdit({ imageU8: basePNGBytes, maskU8, prompt: finalPrompt, apiKey: apiKeyEl.value.trim() });
    } else {
      setStatus("Provide a serverless URL or an OpenAI API key.");
      return;
    }
    resultPNGBytes = outU8;
    setStatus("Done. Opening result in Photopea ...");
    window.parent.postMessage(outU8.buffer, "*");
  }catch(err){ console.error(err); setStatus("Error: "+err.message); }
});

openResultBtn.addEventListener("click", ()=>{
  if (!resultPNGBytes) { setStatus("No result yet."); return; }
  window.parent.postMessage(resultPNGBytes.buffer, "*");
});