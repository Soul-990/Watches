const money = (n) => "$" + Number(n).toFixed(2);
const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch (e) {
    return [];
  }
};

const saveCart = (c) => {
  try {
    localStorage.setItem("cart", JSON.stringify(c));
  } catch (e) {}
  updateCount();
};

function updateCount() {
  const n = getCart().reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = n;
}

function toast(msg) {
  const t = document.getElementById("appToast");
  if (!t) return;
  document.getElementById("toastBody").textContent = msg;
  bootstrap.Toast.getOrCreateInstance(t, { delay: 2200 }).show();
}

function addToCart(id) {
  const cart = getCart();
  const found = cart.find((i) => i.id === id);
  if (found) found.qty++;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  const p = products.find((x) => x.id === id);
  toast(p.name + " added to cart");
}

// product cards 
function cardHTML(p) {
  return `
  <div class="col-lg-3 col-md-6 col-12">
    <div class="card product-card h-100">
      <div class="img-wrap"><img src="${p.image}" class="card-img-top" alt="${p.name}"><span class="badge bg-info text-dark cat">${p.category}</span></div>
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${p.name}</h5>
        <p class="card-text text-secondary">${p.description}</p>
        <p class="price">${money(p.price)}</p>
        <div class="mt-auto d-grid gap-2">
          <button class="btn btn-info" onclick="addToCart(${p.id})"><i class="bi bi-bag-plus"></i> Add to Cart</button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-light flex-fill" onclick="openProduct(${p.id})">Read More</button>
            ${p.downloadlink ? `<a href="${p.downloadlink}" class="btn btn-outline-success" download title="Download brochure"><i class="bi bi-download"></i></a>` : ""}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function renderProducts(targetId, list) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map(cardHTML).join("");
}

//  shop page
let currentProduct = null;
function openProduct(id) {
  const p = products.find((x) => x.id === id);
  currentProduct = p;
  document.getElementById("pmTitle").textContent = p.name;
  document.getElementById("pmImg").src = p.image;
  document.getElementById("pmImg").alt = p.name;
  document.getElementById("pmCat").textContent = p.category;
  document.getElementById("pmDesc").textContent = p.description;
  document.getElementById("pmPrice").textContent = money(p.price);
  document.getElementById("pmSpecs").innerHTML = p.specs
    .map((s) => `<li><i class="bi bi-check2-circle text-info"></i> ${s}</li>`)
    .join("");
  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("productModal"),
  ).show();
}
function initShop() {
  let filter = "all";
  const search = document.getElementById("search"),
    sort = document.getElementById("sort");
  function apply() {
    let list = products.filter(
      (p) =>
        (filter === "all" || p.category === filter) &&
        (p.name + " " + p.description)
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()),
    );
    if (sort.value === "low") list.sort((a, b) => a.price - b.price);
    if (sort.value === "high") list.sort((a, b) => b.price - a.price);
    if (sort.value === "name")
      list.sort((a, b) => a.name.localeCompare(b.name));
    renderProducts("data", list);
    document
      .getElementById("noResults")
      .classList.toggle("d-none", list.length > 0);
  }
  document.querySelectorAll("#filters button").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll("#filters button")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      filter = b.dataset.filter;
      apply();
    }),
  );
  search.addEventListener("input", apply);
  sort.addEventListener("change", apply);
  document.getElementById("pmAdd").addEventListener("click", () => {
    addToCart(currentProduct.id);
  });
  apply();
}

// cart page 
function initCart() {
  function draw() {
    const cart = getCart();
    document
      .getElementById("cartEmpty")
      .classList.toggle("d-none", cart.length > 0);
    document
      .getElementById("cartFull")
      .classList.toggle("d-none", cart.length === 0);
    let sub = 0;
    document.getElementById("cartBody").innerHTML = cart
      .map((i) => {
        const p = products.find((x) => x.id === i.id);
        if (!p) return "";
        sub += p.price * i.qty;
        return `<tr>
        <td><div class="d-flex align-items-center gap-3"><img src="${p.image}" class="cart-img" alt=""><div><strong>${p.name}</strong><div class="small text-secondary">${p.category}</div></div></div></td>
        <td>${money(p.price)}</td>
        <td><div class="input-group input-group-sm qty"><button class="btn btn-outline-light" onclick="changeQty(${p.id},-1)">−</button><span class="input-group-text bg-black text-white">${i.qty}</span><button class="btn btn-outline-light" onclick="changeQty(${p.id},1)">+</button></div></td>
        <td>${money(p.price * i.qty)}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="removeItem(${p.id})" aria-label="Remove"><i class="bi bi-trash"></i></button></td></tr>`;
      })
      .join("");
    const ship = sub === 0 || sub >= 200 ? 0 : 9.99;
    document.getElementById("sSub").textContent = money(sub);
    document.getElementById("sShip").textContent = ship ? money(ship) : "Free";
    document.getElementById("sTotal").textContent = money(sub + ship);
  }
  window.changeQty = (id, d) => {
    const c = getCart();
    const i = c.find((x) => x.id === id);
    i.qty += d;
    saveCart(c.filter((x) => x.qty > 0));
    draw();
  };
  window.removeItem = (id) => {
    saveCart(getCart().filter((x) => x.id !== id));
    draw();
  };
  document.getElementById("clearBtn").addEventListener("click", () => {
    saveCart([]);
    draw();
  });
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    saveCart([]);
    draw();
    toast("Thank you! Your order has been placed (demo).");
  });
  draw();
}

// global 
document.addEventListener("DOMContentLoaded", () => {
  updateCount();

  // newsletter
  const nf = document.getElementById("newsletterForm");
  if (nf)
    nf.addEventListener("submit", (e) => {
      e.preventDefault();
      document.getElementById("newsletterMsg").textContent =
        "Thanks for subscribing!";
      nf.reset();
    });

  // back to top
  const top = document.getElementById("toTop");
  window.addEventListener("scroll", () =>
    top.classList.toggle("show", window.scrollY > 400),
  );
  top.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );

  // gallery lightbox
  const lb = document.getElementById("lightbox");
  if (lb)
    lb.addEventListener("show.bs.modal", (e) => {
      const a = e.relatedTarget;
      document.getElementById("lbImg").src = a.dataset.src;
      document.getElementById("lbCap").textContent = a.dataset.cap;
    });

  // contact form validation
  const cf = document.getElementById("contactForm");
  if (cf)
    cf.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      cf.querySelectorAll("[required]").forEach((f) => {
        const bad = !f.checkValidity();
        f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (ok) {
        document.getElementById("formSuccess").classList.remove("d-none");
        cf.reset();
      }
    });

  // animated stats
  document.querySelectorAll("[data-count]").forEach((el) => {
    const raw = el.dataset.count,
      num = parseFloat(raw.replace(/[^\d.]/g, "")),
      suffix = raw.replace(/[\d.]/g, "");
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      let t0 = null;
      const step = (t) => {
        t0 = t0 || t;
        const p = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(num * p) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
  });
});
