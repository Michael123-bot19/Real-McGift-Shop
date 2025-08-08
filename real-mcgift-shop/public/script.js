// public/script.js - front-end logic
const WA_NUMBER = "234XXXXXXXXXX"; // <-- replace with actual number e.g. 2348012345678
document.getElementById('owner-contact').textContent = 'WhatsApp: +' + WA_NUMBER;

const productListEl = document.getElementById('product-list');
const zoomModal = document.getElementById('zoom-modal');
const zoomImg = document.getElementById('zoom-img');
const zoomClose = document.getElementById('zoom-close');

async function loadProducts(){
  productListEl.innerHTML = '';
  try {
    const r = await fetch('/api/products');
    if(!r.ok) throw new Error('Failed to load');
    const items = await r.json();
    if(items.length===0){ productListEl.innerHTML = '<p style="text-align:center;color:#666">No products yet — admin can upload items at /admin</p>'; return; }
    items.forEach(it => productListEl.appendChild(createItem(it)));
  } catch(e){
    productListEl.innerHTML = '<p style="text-align:center;color:#c00">Unable to load products. Is the server running?</p>';
    console.error(e);
  }
}

function createItem(it){
  const el = document.createElement('div');
  el.className = 'item';
  const img = document.createElement('img');
  img.src = 'products/' + encodeURIComponent(it.filename);
  img.alt = it.title || '';
  img.addEventListener('click', ()=> openZoom(it));
  const meta = document.createElement('div');
  meta.className = 'meta';
  const title = document.createElement('div'); title.className='title'; title.textContent = it.title || '';
  const price = document.createElement('div'); price.className='price'; price.textContent = it.price ? it.price : '';
  const desc = document.createElement('div'); desc.className='desc'; desc.textContent = it.desc || '';
  const actions = document.createElement('div'); actions.className='actions';
  const wa = document.createElement('a'); wa.className='btn wa'; wa.textContent='Buy on WhatsApp'; wa.target='_blank';
  const msg = encodeURIComponent('Hello, I want to buy this item: ' + (it.title || ''));
  wa.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  const copy = document.createElement('button'); copy.className='btn copy'; copy.textContent='Copy link';
  copy.addEventListener('click', async ()=>{
    const url = location.origin + '/products/' + encodeURIComponent(it.filename);
    try { await navigator.clipboard.writeText(url); copy.textContent='Copied!'; setTimeout(()=>copy.textContent='Copy link',1500); } catch(e){ alert('Copy failed. Link: ' + url); }
  });
  actions.appendChild(wa); actions.appendChild(copy);
  meta.appendChild(title); meta.appendChild(price); meta.appendChild(desc); meta.appendChild(actions);
  el.appendChild(img); el.appendChild(meta);
  return el;
}

function openZoom(it){
  zoomImg.src = 'products/' + encodeURIComponent(it.filename);
  zoomModal.style.display = 'flex';
}
zoomClose.addEventListener('click', ()=> zoomModal.style.display='none');
zoomModal.addEventListener('click', (e)=>{ if(e.target===zoomModal) zoomModal.style.display='none'; });

// initial load and periodic refresh
loadProducts();
setInterval(loadProducts, 30000);
