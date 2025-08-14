import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import { GoogleAuth } from "google-auth-library";

const app = express();
const upload = multer();

const PROJECT_ID = process.env.GCP_PROJECT;
const LOCATION   = process.env.VERTEX_LOCATION || "us-central1";
const MODEL_ID   = process.env.VERTEX_MODEL || `publishers/google/models/imagemodel@005`;
const IMAGEN_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/${MODEL_ID}:predict`;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

async function geminiRewritePrompt(prompt, apiKey){
  if (!apiKey) return prompt;
  const body = { contents: [{ role: "user", parts: [{ text: `Rewrite this image-editing instruction to be short, precise and visual-only. Keep Arabic where used. Instruction: ${prompt}` }]}] };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
  if(!res.ok){ return prompt; }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
}

async function callVertexInpaint({imagePng, maskPng, prompt}){
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const imageB64 = imagePng.toString("base64");
  const maskB64  = maskPng.toString("base64");
  const body = { instances: [{ prompt, image: { bytesBase64Encoded: imageB64 }, mask: { bytesBase64Encoded: maskB64 } }], parameters: {} };
  const res = await fetch(IMAGEN_URL, { method:"POST", headers:{ "Authorization": `Bearer ${token.token || token}`, "Content-Type":"application/json" }, body: JSON.stringify(body) });
  if(!res.ok){ throw new Error(await res.text()); }
  const data = await res.json();
  const pred = (data.predictions && data.predictions[0]) || data.data?.[0];
  const outB64 = pred?.bytesBase64Encoded || pred?.b64_json || pred?.b64;
  if(!outB64) throw new Error("No image bytes in response");
  return Buffer.from(outB64, "base64");
}

app.post("/edit", upload.fields([{name:"image"},{name:"mask"}]), async (req,res)=>{
  try{
    const imagePng = req.files.image?.[0]?.buffer;
    const maskPng  = req.files.mask?.[0]?.buffer;
    let prompt     = req.body.prompt || "";
    if(!imagePng || !maskPng) return res.status(400).send("image/mask required");
    const headerKey = req.headers["x-gemini-key"];
    const key = (headerKey && String(headerKey)) || process.env.GEMINI_API_KEY || "";
    if(key) prompt = await geminiRewritePrompt(prompt, key);
    const outPng = await callVertexInpaint({ imagePng, maskPng, prompt });
    res.set("Content-Type", "image/png"); res.send(outPng);
  }catch(e){ console.error(e); res.status(500).send(String(e)); }
});

app.get("/", (_,_res)=>_.send("OK"));
app.listen(process.env.PORT || 8080, ()=>console.log("Server running"));
