var menuData = [];
var cart = {};

// Default images for Bestsellers
const defaultImages = {
  "PANEER TIKKA": "https://images.unsplash.com/photo-1567184109191-37a692799335?q=80&w=300&h=300&auto=format&fit=crop",
  "VEG FRIED RICE": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=300&h=300&auto=format&fit=crop",
  "PANEER CHILLY": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=300&h=300&auto=format&fit=crop",
  "SOLKADI": "https://images.unsplash.com/photo-1544145945-f904253d0c7e?q=80&w=300&h=300&auto=format&fit=crop",
  "POMFRET TAWA FRY": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=300&h=300&auto=format&fit=crop",
  "BOMBIL RAWA FRY": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=80&w=300&h=300&auto=format&fit=crop",
  "CHICKEN BIRYANI": "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?q=80&w=300&h=300&auto=format&fit=crop",
  "DAL KHICHDI": "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?q=80&w=300&h=300&auto=format&fit=crop"
};

const placeholderImg = "https://images.unsplash.com/photo-1495195129352-aec325a55b65?q=80&w=300&h=300&auto=format&fit=crop";

// Fetch and Render Menu
async function fetchMenu() {
  try {
    const response = await fetch('menu.json');
    menuData = await response.json();
    renderMenu();
  } catch (error) {
    console.error('Error fetching menu:', error);
  }
}

function isNonVeg(name) {
  const keywords = ['chicken', 'mutton', 'egg', 'fish', 'prawns', 'crab', 'pomfret', 'bombil', 'surmai', 'rawas', 'nonveg', 'non-veg'];
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function renderMenu() {
  const menuEl = document.getElementById('menu');
  const catNav = document.getElementById('category-nav');
  if (!menuEl) return;
  menuEl.innerHTML = '';
  if (catNav) catNav.innerHTML = '';

  const savedImages = JSON.parse(localStorage.getItem('menuImages') || '{}');

  menuData.forEach((sec, idx) => {
    const sectionId = `section-${idx}`;
    
    // Create category pill
    if (catNav) {
      const pill = document.createElement('button');
      pill.className = 'category-pill' + (idx === 0 ? ' active' : '');
      pill.innerText = sec.title.replace('BEST SELLER ', '').split('(')[0].trim();
      pill.onclick = () => {
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
      };
      catNav.appendChild(pill);
    }

    const section = document.createElement('div');
    section.id = sectionId;
    const isBestseller = sec.title.includes('BEST SELLER');
    section.className = 'section' + (isBestseller ? ' bestseller' : '');

    const title = document.createElement('h3');
    title.innerHTML = sec.title;
    section.appendChild(title);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items-container';

    sec.items.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'item';
      
      const itemIsNonVeg = isNonVeg(item.name) || sec.title.includes('NONVEG');
      const indicator = itemIsNonVeg ? 'non-veg-indicator' : 'veg-indicator';
      const imgUrl = savedImages[item.name] || defaultImages[item.name] || placeholderImg;

      let priceDisplay = '';
      if (typeof item.price === 'object') {
        priceDisplay = `₹${item.price.full || item.price.half}`;
      } else {
        priceDisplay = item.price === 'APC' ? 'APC' : `₹${item.price}`;
      }

      itemCard.innerHTML = `
        <div class="item-img-container">
          <img src="${imgUrl}" class="item-img" alt="${item.name}" loading="lazy">
        </div>
        <div class="item-info">
          <div>
            <div class="${indicator}"></div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${priceDisplay}</div>
          </div>
          <div class="admin-controls">
            <input type="text" class="admin-input" placeholder="Image URL..." value="${savedImages[item.name] || ''}">
            <button class="admin-save-btn" onclick="saveImg('${item.name}', this)">Save</button>
          </div>
        </div>
      `;
      
      const actionArea = document.createElement('div');
      actionArea.style.cssText = 'display:flex; flex-direction:column; justify-content:center; align-items:flex-end; gap:8px;';

      if (typeof item.price === 'object') {
        if (item.price.full) {
          const b = document.createElement('button');
          b.className = 'add-btn';
          b.innerText = `Full — Add`;
          b.onclick = () => addToCartWithSize(item, 'FULL', item.price.full);
          actionArea.appendChild(b);
        }
        if (item.price.half) {
          const b = document.createElement('button');
          b.className = 'add-btn';
          b.innerText = `Half — Add`;
          b.onclick = () => addToCartWithSize(item, 'HALF', item.price.half);
          actionArea.appendChild(b);
        }
      } else if (item.price !== 'APC') {
        const b = document.createElement('button');
        b.className = 'add-btn';
        b.innerText = 'Add';
        b.onclick = () => addToCart(item);
        actionArea.appendChild(b);
      }
      
      itemCard.appendChild(actionArea);
      itemsContainer.appendChild(itemCard);
    });
    section.appendChild(itemsContainer);
    menuEl.appendChild(section);
  });
}

function saveImg(name, btn) {
  const input = btn.previousElementSibling;
  const url = input.value.trim();
  const savedImages = JSON.parse(localStorage.getItem('menuImages') || '{}');
  if (url) savedImages[name] = url;
  else delete savedImages[name];
  localStorage.setItem('menuImages', JSON.stringify(savedImages));
  alert('Image saved!');
  renderMenu();
}

window.saveImg = saveImg;

// Cart Management
function addToCart(item) {
  const key = item.name;
  if (!cart[key]) cart[key] = { price: item.price, qty: 0, label: item.name };
  cart[key].qty++;
  renderCart();
  showCartAnimation();
}

function addToCartWithSize(item, size, price) {
  const key = `${item.name} (${size})`;
  if (!cart[key]) cart[key] = { price: price, qty: 0, label: key };
  cart[key].qty++;
  renderCart();
  showCartAnimation();
}

function showCartAnimation() {
  const btn = document.getElementById('floating-cart-btn');
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function changeQty(key, delta) {
  if (cart[key]) {
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];
    renderCart();
  }
}

function removeItem(key) {
  delete cart[key];
  renderCart();
}

window.changeQty = changeQty;
window.removeItem = removeItem;

function renderCart() {
  const c = document.getElementById('cart-items');
  const badge = document.getElementById('cart-badge');
  if (!c) return;
  c.innerHTML = '';
  
  let subtotal = 0, totalQty = 0;
  const keys = Object.keys(cart);

  if (keys.length === 0) {
    c.innerHTML = '<div style="text-align:center; padding:40px 0; color:#888;">Your cart is empty</div>';
    if (badge) badge.style.display = 'none';
    showView('items');
    return;
  }

  if (badge) {
    badge.style.display = 'flex';
    badge.textContent = Object.values(cart).reduce((a, b) => a + b.qty, 0);
  }
  
  keys.forEach(key => {
    const obj = cart[key];
    subtotal += obj.price * obj.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="flex:1;"><div style="font-weight:600;">${obj.label}</div>₹${obj.price}</div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty('${key}', -1)">-</button>
        <span>${obj.qty}</span>
        <button class="qty-btn" onclick="changeQty('${key}', 1)">+</button>
      </div>
    `;
    c.appendChild(div);
  });

  const discount = subtotal * 0.10, after = subtotal - discount, gst = after * 0.05, grand = Math.round(after + gst);
  const summary = document.createElement('div');
  summary.style.marginTop = '20px';
  summary.style.padding = '15px';
  summary.style.background = '#f8f9fb';
  summary.style.borderRadius = '12px';
  summary.innerHTML = `
    <div style="display:flex; justify-content:space-between; font-size:13px;"><span>Subtotal</span><span>₹${subtotal}</span></div>
    <div style="display:flex; justify-content:space-between; font-size:13px; color:#2ecc71;"><span>10% Off</span><span>-₹${discount.toFixed(2)}</span></div>
    <div style="display:flex; justify-content:space-between; font-weight:700; font-size:16px; margin-top:10px; border-top:1px dashed #ddd; padding-top:10px;"><span>Total</span><span>₹${grand}</span></div>
  `;
  c.appendChild(summary);
}

function showView(view) {
  const isItems = view === 'items';
  document.getElementById('cart-main-view').style.display = isItems ? 'block' : 'none';
  document.getElementById('cart-checkout-view').style.display = isItems ? 'none' : 'block';
}

function generateMessage() {
  let subtotal = 0;
  let msg = 'Hello HOTEL ZEE100, I’d like to order:\n\n';
  Object.keys(cart).forEach(key => {
    const o = cart[key];
    subtotal += o.price * o.qty;
    msg += `• ${o.label} x ${o.qty}\n`;
  });
  const grand = Math.round((subtotal * 0.9) * 1.05);
  msg += `\nTotal: ₹${grand}`;
  return msg;
}

document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkout-btn');
  const backBtn = document.getElementById('back-to-items');
  const floatingBtn = document.getElementById('floating-cart-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const adminToggle = document.getElementById('admin-toggle');

  if (checkoutBtn) checkoutBtn.onclick = () => showView('checkout');
  if (backBtn) backBtn.onclick = () => showView('items');
  if (document.getElementById('close-cart-btn')) document.getElementById('close-cart-btn').onclick = () => cartSidebar.classList.remove('active');
  if (floatingBtn) floatingBtn.onclick = () => cartSidebar.classList.toggle('active');
  
  if (adminToggle) {
    adminToggle.onclick = () => {
      document.body.classList.toggle('admin-mode');
      adminToggle.innerText = document.body.classList.contains('admin-mode') ? '🔓 Admin Mode Active' : '🔒 Admin Mode';
    };
  }

  document.getElementById('whatsapp-send').onclick = () => {
    const d = {}; let v = true;
    ['name', 'mobile', 'building', 'flat', 'sector'].forEach(f => {
      d[f] = document.getElementById(f).value.trim();
      if (!d[f]) v = false;
    });
    if (!v) return alert('Please fill all details');
    const message = encodeURIComponent(`${generateMessage()}\n\nDetails:\n${d.name}, ${d.mobile}\n${d.flat}, ${d.building}, Sector ${d.sector}`);
    location.href = `https://wa.me/919867890006?text=${message}`;
  };

  document.getElementById('searchBar').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.section').forEach(s => {
      let m = false;
      s.querySelectorAll('.item').forEach(i => {
        const vis = i.querySelector('.item-name').textContent.toLowerCase().includes(q);
        i.style.display = vis ? 'flex' : 'none';
        if (vis) m = true;
      });
      s.style.display = m || q === '' ? 'block' : 'none';
    });
  };

  fetchMenu();
  renderCart();
});
