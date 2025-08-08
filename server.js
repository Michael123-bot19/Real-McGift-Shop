// server.js - Simple Express server with admin upload/edit/delete
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, "public");
const productsDir = path.join(publicDir, "products");
const dataFile = path.join(__dirname, "items.json");

if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

app.use(express.static(publicDir));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Load admin password from env or config.json
let ADMIN_PASS = process.env.ADMIN_PASS || null;
const configPath = path.join(__dirname, "config.json");
if (!ADMIN_PASS && fs.existsSync(configPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath,'utf8'));
    ADMIN_PASS = cfg.adminPass || ADMIN_PASS;
  } catch(e) { console.warn("Could not read config.json:", e.message); }
}
if (!ADMIN_PASS) console.warn("WARNING: ADMIN_PASS not set. Create config.json or set ADMIN_PASS env var to secure admin page.");

// Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9\.\-\_]/g,'');
    let finalName = safeName;
    if (fs.existsSync(path.join(productsDir, finalName))) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalName = `${base}-${Date.now()}${ext}`;
    }
    cb(null, finalName);
  }
});

const fileFilter = (req, file, cb) => {
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) cb(null, true);
  else cb(new Error("Only image files are allowed."));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: read/write items.json
function readItems(){ try { return JSON.parse(fs.readFileSync(dataFile,'utf8')); } catch(e){ return []; } }
function writeItems(items){ fs.writeFileSync(dataFile, JSON.stringify(items, null, 2)); }

// API to list image files and items metadata
app.get("/api/products", (req, res) => {
  const images = fs.readdirSync(productsDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const items = readItems();
  // Merge metadata with filenames; items must contain {id, filename, title, price, desc}
  // For any image with no metadata, create a default entry on the fly
  const merged = images.map(img => {
    const meta = items.find(it => it.filename === img);
    if (meta) return meta;
    return { id: "img-"+img, filename: img, title: img.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), price: "", desc: "" };
  });
  // sort by file mtime desc
  const filesWithMtime = merged.map(m => {
    const full = path.join(productsDir, m.filename);
    let mtime = 0;
    try { mtime = fs.statSync(full).mtimeMs; } catch(e){}
    return Object.assign({}, m, { mtime });
  }).sort((a,b)=> b.mtime - a.mtime);
  res.json(filesWithMtime);
});

// Admin page served as static admin.html in public/
app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));

// Upload images and metadata
app.post("/admin/upload", upload.array("images", 20), (req, res) => {
  const providedPass = req.body.password || "";
  if (!ADMIN_PASS || providedPass !== ADMIN_PASS) {
    if (req.files && req.files.length) req.files.forEach(f=>{ try{ fs.unlinkSync(f.path);}catch(e){} });
    return res.status(403).json({ success:false, message:"Unauthorized. Invalid admin password." });
  }
  const items = readItems();
  const uploaded = (req.files||[]).map(f => {
    const id = "item-"+Date.now()+"-"+Math.floor(Math.random()*1000);
    const title = (req.body.title || f.originalname).toString().slice(0,120);
    const price = req.body.price || "";
    const desc = req.body.desc || "";
    const obj = { id, filename: f.filename, title, price, desc };
    items.push(obj);
    return obj;
  });
  writeItems(items);
  res.json({ success:true, uploaded });
});

// Edit item metadata (title, price, desc) and optional image replace
app.post("/admin/edit", upload.single("image"), (req, res) => {
  const providedPass = req.body.password || "";
  if (!ADMIN_PASS || providedPass !== ADMIN_PASS) {
    if (req.file) try{ fs.unlinkSync(req.file.path); }catch(e){}
    return res.status(403).json({ success:false, message:"Unauthorized." });
  }
  const items = readItems();
  const id = req.body.id;
  const item = items.find(x=>x.id===id);
  if (!item) return res.status(404).json({ success:false, message:"Item not found" });
  // replace image if uploaded
  if (req.file) {
    try { const old = path.join(productsDir, item.filename); if (fs.existsSync(old)) fs.unlinkSync(old); } catch(e){}
    item.filename = req.file.filename;
  }
  item.title = req.body.title || item.title;
  item.price = req.body.price || item.price;
  item.desc = req.body.desc || item.desc;
  writeItems(items);
  res.json({ success:true, item });
});

// Delete item
app.post("/admin/delete", express.json(), (req, res) => {
  const providedPass = req.body.password || "";
  if (!ADMIN_PASS || providedPass !== ADMIN_PASS) return res.status(403).json({ success:false, message:"Unauthorized." });
  const id = req.body.id;
  let items = readItems();
  const idx = items.findIndex(x=>x.id===id);
  if (idx===-1) return res.status(404).json({ success:false, message:"Item not found" });
  const [removed] = items.splice(idx,1);
  try { const full = path.join(productsDir, removed.filename); if (fs.existsSync(full)) fs.unlinkSync(full); } catch(e){}
  writeItems(items);
  res.json({ success:true });
});

app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, ()=> console.log("Server running at http://localhost:"+PORT));
