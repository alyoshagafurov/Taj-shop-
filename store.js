/* ==========================================================================
   TAJSHOP — слой данных (мини-бэкенд на localStorage).
   Используется и витриной (app.js), и админ-панелью (admin.js).
   В реальной версии заменяется на настоящий сервер/БД — интерфейс тот же.
   ========================================================================== */
(function (global) {
  "use strict";

  const SEED_VERSION = "5"; // менять, чтобы пере-засеять каталог из data.js
  const K = {
    products: "tj_products",
    orders: "tj_orders",
    users: "tj_users",
    session: "tj_session",
    admin: "tj_admin",
    cart: "tj_cart",
    wish: "tj_wish",
    bookings: "tj_bookings",
    seed: "tj_seed",
  };

  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const emit = () => global.dispatchEvent(new CustomEvent("tj:change"));

  /* ---------- Засев каталога ---------- */
  function seed() {
    if (get(K.seed, null) !== SEED_VERSION) {
      set(K.products, clone(PRODUCTS));
      set(K.seed, SEED_VERSION);
    }
    if (!get(K.users, null)) set(K.users, []);
  }

  /* ---------- Цены и акции ---------- */
  const saleActive = (p) => !!(p.sale && p.sale.percent > 0 && p.sale.until > Date.now());
  function effPrice(p) { return saleActive(p) ? Math.round(p.price * (1 - p.sale.percent / 100)) : p.price; }
  function oldPriceOf(p) { return saleActive(p) ? p.price : (p.oldPrice && p.oldPrice > p.price ? p.oldPrice : null); }
  function discountPct(p) {
    if (saleActive(p)) return p.sale.percent;
    if (p.oldPrice && p.oldPrice > p.price) return Math.round((1 - p.price / p.oldPrice) * 100);
    return 0;
  }
  const onSale = (p) => saleActive(p) || (p.oldPrice && p.oldPrice > p.price);

  /* ---------- Путь к изображению ---------- */
  function imgPath(name) {
    if (!name) return "";
    if (name.startsWith("data:") || name.startsWith("http") || name.includes("/")) return name;
    return "images/" + name + ".jpg";
  }

  /* ---------- Товары ---------- */
  const Products = {
    all() { return get(K.products, []); },
    get(id) { return this.all().find((p) => p.id === +id); },
    nextId() { return (this.all().reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1; },
    save(p) {
      const list = this.all();
      const i = list.findIndex((x) => x.id === p.id);
      if (i > -1) list[i] = p;
      else { p.id = this.nextId(); list.push(p); }
      set(K.products, list); emit(); return p;
    },
    remove(id) { set(K.products, this.all().filter((p) => p.id !== +id)); emit(); },
    inCat(cat) { return this.all().filter((p) => p.cat === cat); },
  };

  /* ---------- Заказы ---------- */
  const Orders = {
    all() { return get(K.orders, []); },
    add(o) {
      o.id = "TS-" + Math.floor(100000 + Math.random() * 900000);
      o.date = Date.now();
      o.status = "new";
      const list = this.all(); list.unshift(o); set(K.orders, list); emit();
      return o;
    },
    update(id, patch) {
      const list = this.all(); const i = list.findIndex((o) => o.id === id);
      if (i > -1) { list[i] = { ...list[i], ...patch }; set(K.orders, list); emit(); }
    },
    byUser(email) { return this.all().filter((o) => o.email === email); },
    revenue() { return this.all().filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0); },
  };

  /* ---------- Аккаунты клиентов ---------- */
  const Auth = {
    users() { return get(K.users, []); },
    current() { const e = get(K.session, null); return e ? this.users().find((u) => u.email === e) || null : null; },
    register({ name, phone, email, password }) {
      email = (email || "").trim().toLowerCase();
      if (!name || name.trim().length < 2) return { error: "Введите имя" };
      if (!email || !/.+@.+\..+/.test(email)) return { error: "Введите корректный e-mail" };
      if (!password || password.length < 4) return { error: "Пароль минимум 4 символа" };
      const users = this.users();
      if (users.some((u) => u.email === email)) return { error: "Такой e-mail уже зарегистрирован" };
      const user = { name: name.trim(), phone: (phone || "").trim(), email, password, joined: Date.now() };
      users.push(user); set(K.users, users); set(K.session, email); emit();
      return { user };
    },
    login(email, password) {
      email = (email || "").trim().toLowerCase();
      const u = this.users().find((x) => x.email === email);
      if (!u || u.password !== password) return { error: "Неверный e-mail или пароль" };
      set(K.session, email); emit(); return { user: u };
    },
    logout() { localStorage.removeItem(K.session); emit(); },
    update(patch) {
      const cur = this.current(); if (!cur) return;
      const users = this.users(); const i = users.findIndex((u) => u.email === cur.email);
      users[i] = { ...users[i], ...patch }; set(K.users, users); emit();
    },
  };

  /* ---------- Админ-сессия ---------- */
  const Admin = {
    PASSWORD: "admin",
    isAuthed() { return get(K.admin, false) === true; },
    login(pass) { if (pass === this.PASSWORD) { set(K.admin, true); return true; } return false; },
    logout() { localStorage.removeItem(K.admin); },
  };

  /* ---------- Корзина ---------- */
  const Cart = {
    all() { return get(K.cart, []); },
    add(id, color, size, qty = 1) {
      const key = `${id}|${color}|${size}`;
      const list = this.all(); const ex = list.find((i) => i.key === key);
      if (ex) ex.qty += qty; else list.push({ key, id: +id, color, size, qty });
      set(K.cart, list); emit();
    },
    setQty(key, d) {
      let list = this.all(); const it = list.find((i) => i.key === key);
      if (!it) return; it.qty += d;
      if (it.qty < 1) list = list.filter((i) => i.key !== key);
      set(K.cart, list); emit();
    },
    remove(key) { set(K.cart, this.all().filter((i) => i.key !== key)); emit(); },
    clear() { set(K.cart, []); emit(); },
    count() { return this.all().reduce((s, i) => s + i.qty, 0); },
    total() { return this.all().reduce((s, i) => { const p = Products.get(i.id); return p ? s + effPrice(p) * i.qty : s; }, 0); },
  };

  /* ---------- Избранное ---------- */
  const Wish = {
    all() { return get(K.wish, []); },
    has(id) { return this.all().includes(+id); },
    toggle(id) {
      id = +id; const list = this.all(); const i = list.indexOf(id);
      if (i > -1) list.splice(i, 1); else list.push(id);
      set(K.wish, list); emit(); return list.includes(id);
    },
    remove(id) { set(K.wish, this.all().filter((x) => x !== +id)); emit(); },
    count() { return this.all().length; },
  };

  /* ---------- Брони ---------- */
  const Bookings = {
    all() { return get(K.bookings, []); },
    add(b) {
      b.id = "BR-" + Math.floor(1000 + Math.random() * 9000);
      b.date = Date.now(); b.status = "active";
      const list = this.all(); list.unshift(b); set(K.bookings, list); emit(); return b;
    },
    remove(id) { set(K.bookings, this.all().filter((b) => b.id !== id)); emit(); },
    byUser(email) { return this.all().filter((b) => b.email === email); },
  };

  seed();

  /* кросс-вкладочная синхронизация (админка ↔ витрина) */
  global.addEventListener("storage", () => emit());

  global.Store = {
    K, get, set, imgPath,
    effPrice, oldPriceOf, discountPct, onSale, saleActive,
    Products, Orders, Auth, Admin, Cart, Wish, Bookings,
    CATEGORIES, SHOP, COL,
  };
})(window);
