# AI Edit (Smart) — Photopea Plugin (Ready for GitHub Pages)

**Features**
- Auto intent detection (Arabic + English): Remove / Replace / Generate
- Mask painter (transparent where to edit)
- Fetches flattened PNG from Photopea, sends result back
- Works with OpenAI Images Edit or your own serverless

**Deploy on GitHub Pages**
1) Create a public repo (e.g., `photopea-ai-edit`) and upload these files to the root.  
2) In GitHub → Settings → Pages → Source: `main` / `/ (root)` → Save.  
3) Your URL becomes `https://<USER>.github.io/<REPO>/`.  
4) Edit `pp-plugin.json`: replace both URLs with your Pages URL (`.../index.html` and `.../icon.png`).  
5) In Photopea: **Window → Plugins → Add Plugin** → paste the URL to `pp-plugin.json`.

**Usage**
- Click **Fetch image** → paint the area to edit → write the prompt → **Run**.  
- Provide either a **serverless endpoint** or an **OpenAI API key** (client-side).

Security note: Prefer a serverless endpoint so your API key stays secret.