var menuData = [];
var cart = {};

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

function renderMenu() {
  const menuEl = document.getElementById('menu');
  if (!menuEl) return;
  menuEl.innerHTML = '';

  menuData.forEach(sec => {
    const section = document.createElement('div');
    section.className = 'section collapsed';

    const title = document.createElement('h3');
    title.innerHTML = (sec.title.includes('BEST SELLER') ? '👑 ' : '') + sec.title;
    title.onclick = () => {
      const isExpanded = section.classList.contains('expanded');
      document.querySelectorAll('.section').forEach(s => {
        s.classList.add('collapsed');
        s.classList.remove('expanded');
      });
      if (!isExpanded) {
        section.classList.add('expanded');
        section.classList.remove('collapsed');
      }
    };

    section.appendChild(title);
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'items-container';

    sec.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item';
      row.innerHTML = `<span class="item-name">${item.name}</span>`;
      
      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-price';

      if (typeof item.price === 'object') {
        const btnsWrap = document.createElement('div');
        btnsWrap.style.cssText = 'display:flex; flex-direction:column; align-items:flex-end; gap:6px; min-width:120px;';
        if (item.price.full) {
          const b = document.createElement('button');
          b.className = 'add-btn';
          b.innerText = `FULL ₹${item.price.full} — Add`;
          b.onclick = () => addToCartWithSize(item, 'FULL', item.price.full);
          btnsWrap.appendChild(b);
        }
        if (item.price.half) {
          const b = document.createElement('button');
          b.className = 'add-btn';
          b.innerText = `HALF ₹${item.price.half} — Add`;
          b.onclick = () => addToCartWithSize(item, 'HALF', item.price.half);
          btnsWrap.appendChild(b);
        }
        priceSpan.appendChild(btnsWrap);
      } else {
        priceSpan.innerHTML = `<span>${item.price === 'APC' ? 'APC' : '₹' + item.price} </span>`;
        if (item.price !== 'APC') {
          const b = document.createElement('button');
          b.className = 'add-btn';
          b.innerText = 'Add';
          b.onclick = () => addToCart(item);
          priceSpan.appendChild(b);
        }
      }
      row.appendChild(priceSpan);
      itemsContainer.appendChild(row);
    });
    section.appendChild(itemsContainer);
    menuEl.appendChild(section);
  });
}

// Cart Management
function addToCart(item) {
  if (!cart[item.name]) cart[item.name] = { price: item.price, qty: 0, label: item.name };
  cart[item.name].qty++;
  renderCart();
}

function addToCartWithSize(item, size, price) {
  const key = `${item.name} (${size})`;
  if (!cart[key]) cart[key] = { price: price, qty: 0, label: key };
  cart[key].qty++;
  renderCart();
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

// Attach functions to window for inline onclicks
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
    c.innerHTML = '(No items yet)';
    if (badge) badge.style.display = 'none';
    showView('items');
    return;
  }

  if (badge) badge.style.display = 'block';
  
  keys.forEach(key => {
    const obj = cart[key];
    totalQty += obj.qty;
    subtotal += obj.price * obj.qty;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="flex:1;"><strong>${obj.label}</strong><br>₹${obj.price}</div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty('${key}', -1)">-</button>
        <span>${obj.qty}</span>
        <button class="qty-btn" onclick="changeQty('${key}', 1)">+</button>
      </div>
      <button class="remove-btn" style="margin-left:10px; background:#ff6b6b; color:white; border:none; padding:4px 8px; border-radius:6px; cursor:pointer;" onclick="removeItem('${key}')">Remove</button>`;
    c.appendChild(div);
  });

  if (badge) badge.textContent = totalQty;
  const discount = subtotal * 0.10, after = subtotal - discount, gst = after * 0.025;
  const grand = Math.round(after + (gst * 2));
  const summary = document.createElement('div');
  summary.style.marginTop = '10px';
  summary.innerHTML = `<hr><div>Subtotal: ₹${subtotal.toFixed(2)}</div>
    <div>Discount (10%): -₹${discount.toFixed(2)}</div>
    <div>GST (5%): ₹${(gst * 2).toFixed(2)}</div>
    <hr><div style="font-weight:bold;">Grand Total: ₹${grand}</div>`;
  c.appendChild(summary);
}

function showView(view) {
  const isItems = view === 'items';
  const mainView = document.getElementById('cart-main-view');
  const checkoutView = document.getElementById('cart-checkout-view');
  const cartTitle = document.getElementById('cart-title');
  
  if (mainView) mainView.style.display = isItems ? 'block' : 'none';
  if (checkoutView) checkoutView.style.display = isItems ? 'none' : 'block';
  if (cartTitle) cartTitle.textContent = isItems ? '🛒 Your Cart' : '🚚 Delivery Details';
}

// Global Order Logic
function generateMessage() {
  let subtotal = 0;
  let msg = 'Hello Malvan Tadka Belapur, I’d like to order:\n\n';
  Object.keys(cart).forEach(key => {
    const o = cart[key];
    subtotal += o.price * o.qty;
    msg += `${o.label} x ${o.qty} = ₹${(o.price * o.qty).toFixed(2)}\n`;
  });
  const disc = subtotal * 0.1, after = subtotal - disc, gst = after * 0.05, grand = Math.round(after + gst);
  msg += `\nSubtotal: ₹${subtotal.toFixed(2)}\nDiscount (10%): -₹${disc.toFixed(2)}\nGST (5%): ₹${gst.toFixed(2)}\n---------------------\nGrand Total: ₹${grand}\n\nFor confirmation: 9867890006`;
  return msg;
}

// UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkout-btn');
  const backBtn = document.getElementById('back-to-items');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const floatingBtn = document.getElementById('floating-cart-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const whatsappBtn = document.getElementById('whatsapp-send');
  const searchBar = document.getElementById('searchBar');

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      if (Object.keys(cart).length === 0) return alert('Cart is empty');
      prefillSavedDetails();
      const miniSum = document.getElementById('order-summary-mini');
      if (miniSum) miniSum.textContent = generateMessage().split('---------------------')[0].trim();
      showView('checkout');
    };
  }

  if (backBtn) backBtn.onclick = () => showView('items');

  if (closeCartBtn) {
    closeCartBtn.onclick = (e) => {
      e.stopPropagation();
      cartSidebar.classList.remove('active');
    };
  }

  if (floatingBtn) {
    floatingBtn.onclick = (e) => {
      e.stopPropagation();
      cartSidebar.classList.toggle('active');
    };
  }

  // Robust click outside detection using composedPath
  document.addEventListener('click', (e) => {
    if (!cartSidebar || !floatingBtn) return;
    
    const path = e.composedPath();
    const isClickInsideCart = path.includes(cartSidebar);
    const isClickOnFloatingBtn = path.includes(floatingBtn);
    const isClickOnAddBtn = e.target.closest('.add-btn');
    
    // If the click is NOT on the cart, NOT on the floating button, AND NOT on an "Add" button, close it
    if (cartSidebar.classList.contains('active') && !isClickInsideCart && !isClickOnFloatingBtn && !isClickOnAddBtn) {
      cartSidebar.classList.remove('active');
    }
  });

  if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      const form = getFormData();
      if (!form) return;
      const message = encodeURIComponent(`${generateMessage()}\n\nCustomer Details:\nName: ${form.name}\nMobile: ${form.mobile}\nAddress: ${form.flat}, ${form.building}, Sector ${form.sector}`);
      location.href = `https://wa.me/919867890006?text=${message}`;
    };
  }

  if (searchBar) {
    searchBar.addEventListener('input', searchMenu);
  }

  fetchMenu();
  renderCart();
});

function getFormData() {
  const fields = ['name', 'mobile', 'building', 'flat', 'sector'];
  const data = {};
  let valid = true;
  fields.forEach(f => {
    const el = document.getElementById(f);
    data[f] = el ? el.value.trim() : '';
    if (!data[f]) valid = false;
  });
  if (!valid) {
    alert('Please fill all details.');
    return null;
  }
  
  localStorage.setItem('detailsFilled', 'yes');
  fields.forEach(f => localStorage.setItem('saved' + f.charAt(0).toUpperCase() + f.slice(1), data[f]));
  return data;
}

function prefillSavedDetails() {
  if (!localStorage.getItem('detailsFilled')) return;
  ['Name', 'Mobile', 'Building', 'Flat', 'Sector'].forEach(f => {
    const el = document.getElementById(f.toLowerCase());
    if (el) el.value = localStorage.getItem('saved' + f) || '';
  });
}

function searchMenu() {
  const query = document.getElementById('searchBar').value.toLowerCase();
  document.querySelectorAll('.section').forEach(section => {
    let match = false;
    section.querySelectorAll('.item').forEach(item => {
      const name = item.querySelector('.item-name').textContent.toLowerCase();
      const isVisible = name.includes(query);
      item.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) match = true;
    });
    section.style.display = (match || query === '') ? 'block' : 'none';
    if (query !== '' && match) {
      section.classList.add('expanded');
      section.classList.remove('collapsed');
    } else if (query === '') {
      section.classList.add('collapsed');
      section.classList.remove('expanded');
    }
  });
}
