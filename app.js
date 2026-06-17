/* ==========================================================================
   TAJSHOP — единый клиентский скрипт (лендинг + каталог)
   Страница определяется через <body data-page="landing|catalog">.
   Общий UI (корзина, избранное, аккаунт, карточка товара) работает везде.
   ========================================================================== */
(function () {
  "use strict";
  const S = window.Store;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const PAGE = document.body.dataset.page || "landing";
  const NAV = [{ id: "all", label: "Все товары", icon: "ti-layout-grid" }, ...S.CATEGORIES];
  const catLabel = (id) => (NAV.find((c) => c.id === id) || {}).label || "Все товары";
  const cur = S.SHOP.currency;

  /* ---------- Изображения ---------- */
  function adjust(hex, a) {
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const f = a < 0 ? 1 + a : 1, add = a > 0 ? a * 255 : 0;
    r = Math.min(255, Math.round(r * f + add)); g = Math.min(255, Math.round(g * f + add)); b = Math.min(255, Math.round(b * f + add));
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  function svgImg(type, hex) {
    const st = adjust(hex, -0.3), so = adjust(hex, -0.34);
    const P = {
      tshirt: `<path d="M104 80 L131 62 Q150 84 169 62 L196 80 L232 110 L208 142 L188 126 L188 252 Q150 260 112 252 L112 126 L92 142 L68 110 Z" fill="${hex}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`,
      polo: `<path d="M104 84 L131 66 L150 92 L169 66 L196 84 L232 110 L208 142 L188 126 L188 252 Q150 260 112 252 L112 126 L92 142 L68 110 Z" fill="${hex}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`,
      loafer: `<path d="M58 170 L236 170 Q250 170 250 182 L250 187 Q250 197 236 197 L70 197 Q56 197 56 185 Z" fill="${so}" stroke="${st}" stroke-width="2.6"/><path d="M64 171 Q66 130 120 126 Q177 122 207 138 Q227 147 229 170 Z" fill="${hex}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`,
      slipper: `<path d="M56 186 L244 186 Q258 186 258 200 L258 205 Q258 217 244 217 L70 217 Q54 217 54 203 Z" fill="${so}" stroke="${st}" stroke-width="2.6"/><path d="M74 188 Q76 142 120 142 Q165 142 163 188 L142 188 Q144 160 120 160 Q96 160 94 188 Z" fill="${hex}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`,
      pants: `<path d="M106 66 L194 66 L204 254 L160 254 L150 134 L140 254 L96 254 Z" fill="${hex}" stroke="${st}" stroke-width="3" stroke-linejoin="round"/>`,
    };
    return `<svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect width="300" height="320" fill="#f1efe9"/><ellipse cx="150" cy="276" rx="86" ry="13" fill="rgba(20,18,15,.06)"/>${P[type] || P.tshirt}<text x="278" y="306" text-anchor="end" font-family="Georgia,serif" font-size="20" font-weight="700" fill="rgba(26,26,26,.12)">TS</text></svg>`;
  }
  window.__svgFallback = svgImg;
  function media(p, ci = 0) {
    const col = (p.colors || [])[ci] || {};
    if (col.img) return `<img class="ph" src="${S.imgPath(col.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML=window.__svgFallback('${p.type}','${col.hex || "#999"}')">`;
    return svgImg(p.type, col.hex || "#999");
  }
  function priceHTML(p, big) {
    const eff = S.effPrice(p), old = S.oldPriceOf(p);
    return `<span class="price${big ? " price--lg" : ""}">${fmt(eff)} <span class="cur">${cur}</span></span>${old ? `<span class="price__old">${fmt(old)}</span>` : ""}`;
  }
  function timeLeft(ts) { const d = ts - Date.now(); if (d <= 0) return null; const days = Math.floor(d / 864e5), h = Math.floor((d % 864e5) / 36e5), m = Math.floor((d % 36e5) / 6e4); return days > 0 ? `${days} дн ${h} ч` : `${h} ч ${m} мин`; }
  function plural(n, f) { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return f[2]; if (b > 1 && b < 5) return f[1]; if (b === 1) return f[0]; return f[2]; }

  /* ---------- Навигация между страницами ---------- */
  const catalogUrl = (params) => { const u = new URLSearchParams(params); const s = u.toString(); return "catalog.html" + (s ? "?" + s : ""); };
  function goCat(id) { if (PAGE === "catalog" && window.__setCat) window.__setCat(id); else location.href = id === "all" ? "catalog.html" : catalogUrl({ cat: id }); }

  /* ---------- Общий UI: вставка панелей ---------- */
  function injectUI() {
    const ui = document.createElement("div");
    ui.innerHTML = `
      <div class="overlay" id="overlay"></div>
      <aside class="drawer drawer--left" id="menuDrawer"><div class="drawer__head"><span class="drawer__title">Меню</span><button class="icon-btn" data-close><i class="ti ti-x"></i></button></div><nav class="menu" id="mobileMenu"></nav><div class="drawer__foot"><a class="btn btn--primary btn--block" href="https://t.me/tajshopmagazin" target="_blank" rel="noopener"><i class="ti ti-brand-telegram"></i> Написать в Telegram</a></div></aside>
      <aside class="drawer drawer--right" id="cartDrawer"><div class="drawer__head"><span class="drawer__title">Корзина <span class="drawer__count" id="cartTitleCount"></span></span><button class="icon-btn" data-close><i class="ti ti-x"></i></button></div><div class="drawer__body" id="cartBody"></div><div class="drawer__foot" id="cartFoot"></div></aside>
      <aside class="drawer drawer--right" id="wishDrawer"><div class="drawer__head"><span class="drawer__title">Избранное <span class="drawer__count" id="wishTitleCount"></span></span><button class="icon-btn" data-close><i class="ti ti-x"></i></button></div><div class="drawer__body" id="wishBody"></div></aside>
      <aside class="drawer drawer--right drawer--wide" id="accountDrawer"><div class="drawer__head"><span class="drawer__title" id="accountTitle">Личный кабинет</span><button class="icon-btn" data-close><i class="ti ti-x"></i></button></div><div class="drawer__body" id="accountBody"></div></aside>
      <div class="modal" id="productModal"><div class="modal__inner" id="modalInner"></div></div>
      <div class="modal" id="authModal"><div class="modal__inner modal__inner--sm" id="authInner"></div></div>
      <div class="toast-wrap" id="toastWrap"></div>`;
    document.body.appendChild(ui);
  }

  /* ---------- Тосты ---------- */
  function toast(msg, ok) {
    const el = document.createElement("div");
    el.className = "toast" + (ok ? " toast--ok" : "");
    el.innerHTML = `<i class="ti ${ok ? "ti-circle-check" : "ti-info-circle"}"></i> ${msg}`;
    $("#toastWrap").appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 2600);
  }

  function badges() {
    const cc = S.Cart.count(), wc = S.Wish.count();
    const ce = $("#cartCount"), we = $("#wishCount");
    if (ce) { ce.textContent = cc; ce.classList.toggle("show", cc > 0); }
    if (we) { we.textContent = wc; we.classList.toggle("show", wc > 0); }
    const u = S.Auth.current(), ab = $("#accountBtn");
    if (ab) { ab.classList.toggle("authed", !!u); ab.innerHTML = u ? `<span class="ava-mini">${esc(u.name[0].toUpperCase())}</span>` : `<i class="ti ti-user"></i>`; }
  }

  /* ---------- Карточка товара (общая) ---------- */
  const tagMap = { new: "New", hit: "Хит" };
  function cardBadge(p) { const d = S.discountPct(p); if (d > 0) return `<span class="tag tag--sale">−${d}%</span>`; if (p.badge) return `<span class="tag tag--${p.badge}">${tagMap[p.badge] || ""}</span>`; return ""; }
  function colorDots(cols) { return cols.slice(0, 4).map((c) => `<span class="dot" style="background:${c.hex}" title="${esc(c.name)}"></span>`).join("") + (cols.length > 4 ? `<span class="dot dot--more">+${cols.length - 4}</span>` : ""); }
  function card(p) {
    const w = S.Wish.has(p.id) ? " active" : "";
    return `<article class="card" data-id="${p.id}">
      <div class="card__media">${media(p)}
        <div class="card__badges">${cardBadge(p)}</div>
        <button class="card__wish${w}" data-wish><i class="ti ti-heart${w ? "-filled" : ""}"></i></button>
        <button class="card__quick" data-quick><i class="ti ti-shopping-cart"></i> В корзину</button>
      </div>
      <div class="card__body">
        <span class="card__brand">${esc(p.brand)}</span>
        <h3 class="card__name">${esc(p.name)}</h3>
        <div class="card__colors">${colorDots(p.colors)}</div>
        <div class="card__price">${priceHTML(p)}</div>
        <div class="card__rating"><i class="ti ti-star-filled"></i>${p.rating} · ${p.reviews} отзывов</div>
      </div>
    </article>`;
  }
  function bindCards(container) {
    container.addEventListener("click", (e) => {
      const c = e.target.closest(".card"); if (!c) return; const id = +c.dataset.id;
      if (e.target.closest("[data-wish]")) { e.stopPropagation(); toggleWish(id); return; }
      if (e.target.closest("[data-quick]")) { e.stopPropagation(); const p = S.Products.get(id); if (p.sizes.length === 1) { S.Cart.add(id, p.colors[0].name, p.sizes[0]); toast("Товар добавлен в корзину", true); } else openProduct(id); return; }
      openProduct(id);
    });
  }

  /* ---------- Избранное ---------- */
  function toggleWish(id) { const on = S.Wish.toggle(id); toast(on ? "Добавлено в избранное ❤" : "Удалено из избранного", on); refreshGrids(); }
  function renderWish() {
    $("#wishTitleCount").textContent = S.Wish.count() ? `· ${S.Wish.count()}` : "";
    const ids = S.Wish.all();
    $("#wishBody").innerHTML = ids.length ? ids.map((id) => miniRow(S.Products.get(id))).filter(Boolean).join("") : emptyState("ti-heart", "В избранном пусто", "Нажимайте ❤ на товарах");
  }
  function miniRow(p) {
    if (!p) return "";
    return `<div class="citem" data-id="${p.id}"><div class="citem__media" data-open>${media(p)}</div><div class="citem__info"><div class="citem__name" data-open>${esc(p.name)}</div><div class="citem__meta">${esc(p.brand)}</div><div class="citem__bottom"><span class="citem__price">${priceHTML(p)}</span><button class="btn btn--ghost btn--xs" data-open>Выбрать</button></div></div><button class="citem__rm" data-wrm><i class="ti ti-x"></i></button></div>`;
  }

  /* ---------- Карточка товара (модалка) ---------- */
  let pdp = { id: null, color: 0, size: null };
  function openProduct(id) { pdp = { id: +id, color: 0, size: null }; renderModal(); openModal("#productModal"); }
  function renderModal() {
    const p = S.Products.get(pdp.id); if (!p) return;
    const w = S.Wish.has(p.id), sale = S.saleActive(p), left = sale ? timeLeft(p.sale.until) : null;
    $("#modalInner").innerHTML = `
      <button class="icon-btn modal__close" data-close><i class="ti ti-x"></i></button>
      <div class="pdp">
        <div class="pdp__gallery">
          <div class="pdp__main" id="pdpMain">${media(p, pdp.color)}</div>
          <div class="pdp__thumbs" id="pdpThumbs">${p.colors.map((cc, i) => `<div class="pdp__thumb${i === 0 ? " active" : ""}" data-thumb="${i}">${media(p, i)}</div>`).join("")}</div>
        </div>
        <div class="pdp__info">
          <span class="pdp__brand">${esc(p.brand)}</span>
          <h2 class="pdp__name">${esc(p.name)}</h2>
          <div class="pdp__rating"><span class="stars">★★★★★</span> ${p.rating} · ${p.reviews} отзывов</div>
          ${left ? `<div class="sale-chip"><i class="ti ti-clock-hour-4"></i> Акция ещё ${left}</div>` : ""}
          <div class="pdp__price">${priceHTML(p, true)}${S.discountPct(p) ? `<span class="tag tag--sale">−${S.discountPct(p)}%</span>` : ""}</div>
          <div class="pdp__opt-label">Цвет <span id="colorName">${esc(p.colors[pdp.color].name)}</span></div>
          <div class="pdp__colors" id="pdpColors">${p.colors.map((cc, i) => `<button class="color-opt${i === pdp.color ? " active" : ""}" data-color="${i}" style="background:${cc.hex}" title="${esc(cc.name)}"></button>`).join("")}</div>
          <div class="pdp__opt-label">Размер <span>Таблица размеров</span></div>
          <div class="pdp__sizes" id="pdpSizes">${p.sizes.map((s2) => `<button class="size-opt" data-size="${s2}">${s2}</button>`).join("")}</div>
          <div class="size-hint" id="sizeHint"><i class="ti ti-alert-circle"></i> Выберите размер</div>
          <div class="pdp__actions"><button class="btn btn--primary btn--lg" id="pdpAdd"><i class="ti ti-shopping-cart"></i> В корзину</button><button class="pdp__wish${w ? " active" : ""}" id="pdpWish" data-id="${p.id}"><i class="ti ti-heart${w ? "-filled" : ""}"></i></button></div>
          <button class="btn btn--ghost btn--block" id="pdpBook"><i class="ti ti-calendar-check"></i> Забронировать — примерить в магазине</button>
          <p class="pdp__desc">${esc(p.desc)}</p>
          <div class="pdp__feats"><div class="pdp__feat"><i class="ti ti-check"></i> Доставка по Душанбе в день заказа</div><div class="pdp__feat"><i class="ti ti-check"></i> Оплата при получении, проверка перед оплатой</div><div class="pdp__feat"><i class="ti ti-check"></i> Обмен и возврат в течение 3 дней</div></div>
        </div>
      </div>`;
  }
  function pdpSetColor(i) { const p = S.Products.get(pdp.id); pdp.color = i; $("#pdpMain").innerHTML = media(p, i); $$("#pdpThumbs .pdp__thumb").forEach((t, idx) => t.classList.toggle("active", idx === i)); $$("#pdpColors .color-opt").forEach((b, idx) => b.classList.toggle("active", idx === i)); $("#colorName").textContent = p.colors[i].name; }

  /* ---------- Корзина ---------- */
  function renderCart() {
    const body = $("#cartBody"), foot = $("#cartFoot"), list = S.Cart.all();
    $("#cartTitleCount").textContent = list.length ? `· ${S.Cart.count()}` : "";
    if (!list.length) { body.innerHTML = emptyState("ti-shopping-cart", "Корзина пуста", "Добавьте товары из каталога"); foot.innerHTML = `<a class="btn btn--primary btn--block" href="catalog.html">Перейти в каталог</a>`; return; }
    body.innerHTML = list.map((i) => { const p = S.Products.get(i.id); if (!p) return ""; const ci = Math.max(0, p.colors.findIndex((x) => x.name === i.color));
      return `<div class="citem" data-key="${i.key}"><div class="citem__media">${media(p, ci)}</div><div class="citem__info"><div class="citem__name">${esc(p.name)}</div><div class="citem__meta">${esc(i.color)} · Размер ${esc(i.size)}</div><div class="citem__bottom"><div class="qty"><button data-dec><i class="ti ti-minus"></i></button><span>${i.qty}</span><button data-inc><i class="ti ti-plus"></i></button></div><span class="citem__price">${fmt(S.effPrice(p) * i.qty)} ${cur}</span></div></div><button class="citem__rm" data-rm><i class="ti ti-trash"></i></button></div>`; }).join("");
    const total = S.Cart.total(), free = S.SHOP.freeDeliveryFrom, leftSum = Math.max(0, free - total), pct = Math.min(100, (total / free) * 100);
    const note = leftSum > 0 ? `<div class="cart-note"><i class="ti ti-truck"></i> До бесплатной доставки осталось <b>${fmt(leftSum)} ${cur}</b></div><div class="freebar"><span class="freebar__fill" style="width:${pct}%"></span></div>` : `<div class="cart-note"><i class="ti ti-circle-check"></i> Доставка по Душанбе бесплатно 🎉</div>`;
    foot.innerHTML = `${note}<div class="cart-sum"><span>Товары (${S.Cart.count()})</span><span>${fmt(total)} ${cur}</span></div><div class="cart-sum total"><span>Итого</span><b>${fmt(total)} ${cur}</b></div><button class="btn btn--primary btn--block btn--lg" id="checkoutBtn">Оформить заказ <i class="ti ti-arrow-right"></i></button>`;
  }
  let payMethod = "cash";
  function openCheckout() {
    payMethod = "cash"; const u = S.Auth.current(); $("#cartTitleCount").textContent = "";
    $("#cartBody").innerHTML = `<div class="checkout"><h3>Оформление заказа</h3>
      <div class="field"><label>Имя и фамилия *</label><input id="coName" value="${u ? esc(u.name) : ""}" placeholder="Алишер Рахимов"></div>
      <div class="field"><label>Телефон *</label><input id="coPhone" value="${u ? esc(u.phone || "") : ""}" placeholder="+992 ___ __ __ __" inputmode="tel"></div>
      <div class="field"><label>Адрес доставки</label><input id="coAddr" placeholder="Район, улица, дом"></div>
      <div class="field"><label>Комментарий</label><textarea id="coNote" placeholder="Пожелания…"></textarea></div>
      <div class="field"><label>Способ оплаты</label><div class="pay-opts" id="payOpts"><button class="pay-opt active" data-pay="cash"><i class="ti ti-cash"></i> Наличными</button><button class="pay-opt" data-pay="card"><i class="ti ti-credit-card"></i> Картой при получении</button></div></div></div>`;
    $("#cartFoot").innerHTML = `<div class="cart-sum total"><span>К оплате</span><b>${fmt(S.Cart.total())} ${cur}</b></div><button class="btn btn--accent btn--block btn--lg" id="confirmOrder"><i class="ti ti-circle-check"></i> Подтвердить заказ</button><button class="btn btn--ghost btn--block" id="backToCart" style="margin-top:8px">Назад в корзину</button>`;
  }
  function confirmOrder() {
    const name = $("#coName").value.trim(), phone = $("#coPhone").value.trim();
    if (name.length < 2) { $("#coName").focus(); return toast("Укажите имя"); }
    if (phone.replace(/\D/g, "").length < 7) { $("#coPhone").focus(); return toast("Укажите телефон"); }
    const u = S.Auth.current();
    const items = S.Cart.all().map((i) => { const p = S.Products.get(i.id); return { name: p.name, color: i.color, size: i.size, qty: i.qty, price: S.effPrice(p), img: (p.colors.find((c) => c.name === i.color) || p.colors[0]).img }; });
    const order = S.Orders.add({ items, total: S.Cart.total(), name, phone, addr: $("#coAddr").value.trim(), note: $("#coNote").value.trim(), pay: payMethod, email: u ? u.email : null });
    let txt = `🛍 Заказ ${order.id} — TAJSHOP\n\n`;
    items.forEach((i) => txt += `• ${i.name} (${i.color}, р.${i.size}) ×${i.qty} — ${fmt(i.price * i.qty)} ${cur}\n`);
    txt += `\nИтого: ${fmt(order.total)} ${cur}\nОплата: ${payMethod === "cash" ? "Наличными" : "Картой"}\n\n👤 ${name}\n📞 ${phone}\n${order.addr ? "📍 " + order.addr : ""}`;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    S.Cart.clear();
    $("#cartBody").innerHTML = `<div class="ordered"><div class="ordered__ic"><i class="ti ti-circle-check"></i></div><h3>Заказ оформлен!</h3><p>Номер: <span class="ordnum">${order.id}</span></p><p>Менеджер свяжется с вами в течение 15 минут.</p><p class="muted" style="font-size:13px;margin-top:8px">Детали скопированы — можно отправить в Telegram.</p></div>`;
    $("#cartFoot").innerHTML = `<a class="btn btn--accent btn--block btn--lg" href="${S.SHOP.telegram}" target="_blank" rel="noopener"><i class="ti ti-brand-telegram"></i> Отправить в Telegram</a><button class="btn btn--ghost btn--block" data-close style="margin-top:8px">Продолжить покупки</button>`;
    toast("Заказ оформлен! 🎉", true); refreshGrids();
  }

  /* ---------- Брони ---------- */
  function bookProduct() {
    const u = S.Auth.current();
    if (!u) { closeAll(); setTimeout(() => openAuth("Войдите, чтобы забронировать товар"), 200); return; }
    const p = S.Products.get(pdp.id);
    if (!pdp.size) { $("#sizeHint").classList.add("show"); return; }
    S.Bookings.add({ email: u.email, productId: p.id, name: p.name, color: p.colors[pdp.color].name, size: pdp.size, img: p.colors[pdp.color].img });
    toast("Товар забронирован — ждём вас в магазине!", true); closeAll();
  }

  /* ---------- Вход / регистрация ---------- */
  let authTab = "login", authMsg = "";
  function openAuth(msg) { authTab = "login"; authMsg = msg || ""; renderAuth(); openModal("#authModal"); }
  function renderAuth() {
    $("#authInner").innerHTML = `<button class="icon-btn modal__close" data-close><i class="ti ti-x"></i></button>
      <div class="auth"><div class="auth__logo"><span class="logo__mark"><span class="logo__t">T</span><span class="logo__s">S</span></span></div>
      <div class="auth__tabs"><button class="auth__tab${authTab === "login" ? " active" : ""}" data-atab="login">Вход</button><button class="auth__tab${authTab === "reg" ? " active" : ""}" data-atab="reg">Регистрация</button></div>
      ${authMsg ? `<div class="auth__msg">${esc(authMsg)}</div>` : ""}<div id="authErr" class="auth__err" hidden></div>
      ${authTab === "login" ? `<div class="field"><label>E-mail</label><input id="auEmail" type="email" placeholder="you@mail.com"></div><div class="field"><label>Пароль</label><input id="auPass" type="password" placeholder="••••"></div><button class="btn btn--primary btn--block btn--lg" id="auLogin">Войти</button><p class="auth__hint">Нет аккаунта? <a data-atab="reg">Зарегистрироваться</a></p>`
        : `<div class="field"><label>Имя и фамилия</label><input id="auName" placeholder="Алишер Рахимов"></div><div class="field"><label>Телефон</label><input id="auPhone" placeholder="+992 ___ __ __ __"></div><div class="field"><label>E-mail</label><input id="auEmail" type="email" placeholder="you@mail.com"></div><div class="field"><label>Пароль</label><input id="auPass" type="password" placeholder="минимум 4 символа"></div><button class="btn btn--primary btn--block btn--lg" id="auReg">Создать аккаунт</button><p class="auth__hint">Уже есть аккаунт? <a data-atab="login">Войти</a></p>`}
      </div>`;
  }
  function authError(m) { const e = $("#authErr"); e.textContent = m; e.hidden = false; }
  function doLogin() { const r = S.Auth.login($("#auEmail").value, $("#auPass").value); if (r.error) return authError(r.error); closeAll(); toast(`С возвращением, ${r.user.name}!`, true); }
  function doReg() { const r = S.Auth.register({ name: $("#auName").value, phone: $("#auPhone").value, email: $("#auEmail").value, password: $("#auPass").value }); if (r.error) return authError(r.error); closeAll(); toast(`Добро пожаловать, ${r.user.name}!`, true); }

  /* ---------- Личный кабинет ---------- */
  let accTab = "profile";
  function openAccount() { const u = S.Auth.current(); if (!u) return openAuth("Войдите или зарегистрируйтесь"); accTab = "profile"; renderAccount(); openDrawer("#accountDrawer"); }
  const statusMap = { new: ["Новый", "st-new"], confirmed: ["Подтверждён", "st-conf"], delivered: ["Доставлен", "st-done"], cancelled: ["Отменён", "st-cancel"] };
  function renderAccount() {
    const u = S.Auth.current(); if (!u) { closeAll(); return; }
    const orders = S.Orders.byUser(u.email), books = S.Bookings.byUser(u.email).filter((b) => b.status === "active"), wishN = S.Wish.count();
    const tabs = [["profile", "Профиль", "ti-user"], ["orders", "Заказы", "ti-package"], ["wish", "Избранное", "ti-heart"], ["book", "Брони", "ti-calendar"]];
    const counts = { orders: orders.length, wish: wishN, book: books.length };
    let body = `<div class="acc-head"><div class="acc-ava">${esc(u.name[0].toUpperCase())}</div><div class="acc-id"><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div><button class="btn btn--ghost btn--xs" id="logoutBtn"><i class="ti ti-logout"></i> Выйти</button></div>
      <div class="acc-tabs">${tabs.map(([id, lbl, ic]) => `<button class="acc-tab${accTab === id ? " active" : ""}" data-acctab="${id}"><i class="ti ${ic}"></i>${lbl}${counts[id] ? ` <span class="acc-cnt">${counts[id]}</span>` : ""}</button>`).join("")}</div><div class="acc-pane">`;
    if (accTab === "profile") body += `<div class="field"><label>Имя и фамилия</label><input id="pfName" value="${esc(u.name)}"></div><div class="field"><label>Телефон</label><input id="pfPhone" value="${esc(u.phone || "")}"></div><div class="field"><label>E-mail</label><input value="${esc(u.email)}" disabled></div><button class="btn btn--primary" id="pfSave"><i class="ti ti-device-floppy"></i> Сохранить</button><div class="acc-stats"><div><b>${orders.length}</b><span>заказов</span></div><div><b>${wishN}</b><span>в избранном</span></div><div><b>${books.length}</b><span>броней</span></div></div>`;
    else if (accTab === "orders") body += orders.length ? orders.map(orderRow).join("") : emptyState("ti-package", "Заказов пока нет", "Оформите первый заказ из каталога");
    else if (accTab === "wish") { const ids = S.Wish.all(); body += ids.length ? ids.map((id) => miniRow(S.Products.get(id))).filter(Boolean).join("") : emptyState("ti-heart", "В избранном пусто", "Добавляйте любимые товары"); }
    else if (accTab === "book") body += books.length ? books.map(bookRow).join("") : emptyState("ti-calendar", "Броней нет", "Бронируйте товар, чтобы примерить в магазине");
    body += `</div>`; $("#accountBody").innerHTML = body;
  }
  function orderRow(o) { const [lbl, cls] = statusMap[o.status] || statusMap.new; const d = new Date(o.date).toLocaleDateString("ru-RU"); return `<div class="order-row"><div class="order-row__top"><b>${o.id}</b><span class="order-st ${cls}">${lbl}</span></div><div class="order-row__meta">${d} · ${o.items.length} ${plural(o.items.length, ["товар", "товара", "товаров"])} · <b>${fmt(o.total)} ${cur}</b></div><div class="order-row__items">${o.items.map((i) => `<span>${esc(i.name)} ×${i.qty}</span>`).join("")}</div></div>`; }
  function bookRow(b) { const p = S.Products.get(b.productId); return `<div class="citem" data-bid="${b.id}"><div class="citem__media">${p ? media(p, Math.max(0, p.colors.findIndex((c) => c.name === b.color))) : ""}</div><div class="citem__info"><div class="citem__name">${esc(b.name)}</div><div class="citem__meta">${esc(b.color)} · Размер ${esc(b.size)}</div><div class="citem__bottom"><span class="order-st st-new">Бронь ${b.id}</span></div></div><button class="citem__rm" data-bcancel><i class="ti ti-x"></i></button></div>`; }

  /* ---------- Панели ---------- */
  function emptyState(icon, t, s) { return `<div class="drawer-empty"><i class="ti ${icon}"></i><p>${t}</p><small>${s}</small></div>`; }
  function openDrawer(sel) { $(sel).classList.add("show"); $("#overlay").classList.add("show"); document.body.style.overflow = "hidden"; }
  function openModal(sel) { $(sel).classList.add("show"); $("#overlay").classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeAll() { $$(".drawer").forEach((d) => d.classList.remove("show")); $$(".modal").forEach((m) => m.classList.remove("show")); $("#overlay").classList.remove("show"); document.body.style.overflow = ""; }

  function refreshGrids() { if (PAGE === "catalog" && window.__renderGrid) window.__renderGrid(); if (PAGE === "landing" && window.__renderFeatured) window.__renderFeatured(); }

  /* ---------- Мобильное меню ---------- */
  function renderMobileMenu() {
    $("#mobileMenu").innerHTML =
      NAV.map((c) => `<a href="${c.id === "all" ? "catalog.html" : catalogUrl({ cat: c.id })}"><i class="ti ${c.icon}"></i>${c.label}</a>`).join("") +
      `<div class="menu__sep"></div>` +
      (PAGE === "landing"
        ? `<a href="#about" data-mclose><i class="ti ti-building-store"></i>О магазине</a><a href="#how" data-mclose><i class="ti ti-help-circle"></i>Как заказать</a><a href="#contacts" data-mclose><i class="ti ti-map-pin"></i>Контакты</a>`
        : `<a href="index.html"><i class="ti ti-home"></i>На главную</a>`) +
      `<a href="admin.html"><i class="ti ti-settings"></i>Админ-панель</a>`;
  }

  /* ---------- Шапка ---------- */
  function renderHeaderNav() {
    const nav = $("#catNav");
    if (nav) nav.innerHTML = NAV.map((c) => `<button class="catnav__item" data-cat="${c.id}"><i class="ti ${c.icon}"></i>${c.label}</button>`).join("");
  }
  function wireHeader() {
    $("#cartBtn") && $("#cartBtn").addEventListener("click", () => { renderCart(); openDrawer("#cartDrawer"); });
    $("#wishBtn") && $("#wishBtn").addEventListener("click", () => { renderWish(); openDrawer("#wishDrawer"); });
    $("#accountBtn") && $("#accountBtn").addEventListener("click", openAccount);
    $("#menuBtn") && $("#menuBtn").addEventListener("click", () => openDrawer("#menuDrawer"));

    const si = $("#searchInput"), sb = $("#searchBox");
    if (si) {
      if (PAGE === "landing") {
        const go = () => { const v = si.value.trim(); location.href = v ? catalogUrl({ q: v }) : "catalog.html"; };
        si.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
        $("#searchToggle") && $("#searchToggle").addEventListener("click", () => { location.href = "catalog.html"; });
      }
    }
  }

  /* ---------- Глобальные клики ---------- */
  function bindGlobal() {
    document.addEventListener("click", (e) => {
      const cat = e.target.closest(".catnav__item[data-cat], .chip[data-cat], [data-gocat]");
      if (cat) { e.preventDefault(); goCat(cat.dataset.cat || cat.dataset.gocat); if ($("#menuDrawer").classList.contains("show")) closeAll(); return; }
      if (e.target.closest("[data-mclose]")) { closeAll(); return; }
      const sc = e.target.closest("[data-scroll]"); if (sc) { const t = $("#" + sc.dataset.scroll); if (t) { const top = t.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top, behavior: "smooth" }); } return; }
      const atab = e.target.closest("[data-atab]"); if (atab) { authTab = atab.dataset.atab; authMsg = ""; renderAuth(); return; }
    });
    $("#overlay").addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

    $("#modalInner").addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return closeAll();
      const col = e.target.closest("[data-color]"); if (col) return pdpSetColor(+col.dataset.color);
      const th = e.target.closest("[data-thumb]"); if (th) return pdpSetColor(+th.dataset.thumb);
      const sz = e.target.closest("[data-size]"); if (sz) { pdp.size = sz.dataset.size; $$("#pdpSizes .size-opt").forEach((b) => b.classList.remove("active")); sz.classList.add("active"); $("#sizeHint").classList.remove("show"); return; }
      if (e.target.closest("#pdpWish")) return toggleWish(pdp.id), syncPdpWish();
      if (e.target.closest("#pdpBook")) return bookProduct();
      if (e.target.closest("#pdpAdd")) { const p = S.Products.get(pdp.id); if (!pdp.size) { $("#sizeHint").classList.add("show"); return; } S.Cart.add(p.id, p.colors[pdp.color].name, pdp.size); toast("Товар добавлен в корзину", true); closeAll(); setTimeout(() => { renderCart(); openDrawer("#cartDrawer"); }, 280); return; }
    });
    $("#authInner").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) return closeAll(); if (e.target.closest("#auLogin")) return doLogin(); if (e.target.closest("#auReg")) return doReg(); });
    $("#authInner").addEventListener("keydown", (e) => { if (e.key === "Enter") { if ($("#auLogin")) doLogin(); else if ($("#auReg")) doReg(); } });

    $("#cartBody").addEventListener("click", (e) => {
      const it = e.target.closest("[data-key]");
      if (it) { const k = it.dataset.key; if (e.target.closest("[data-inc]")) { S.Cart.setQty(k, 1); return renderCart(); } if (e.target.closest("[data-dec]")) { S.Cart.setQty(k, -1); return renderCart(); } if (e.target.closest("[data-rm]")) { S.Cart.remove(k); return renderCart(); } }
      if (e.target.closest("[data-close]")) return closeAll();
      const pay = e.target.closest("[data-pay]"); if (pay) { payMethod = pay.dataset.pay; $$("#payOpts .pay-opt").forEach((b) => b.classList.toggle("active", b === pay)); }
    });
    $("#cartFoot").addEventListener("click", (e) => { if (e.target.closest("#checkoutBtn")) return openCheckout(); if (e.target.closest("#confirmOrder")) return confirmOrder(); if (e.target.closest("#backToCart")) return renderCart(); if (e.target.closest("[data-close]")) return closeAll(); });

    $("#wishBody").addEventListener("click", (e) => { const it = e.target.closest("[data-id]"); if (!it) return; const id = +it.dataset.id; if (e.target.closest("[data-wrm]")) { toggleWish(id); return renderWish(); } if (e.target.closest("[data-open]")) { closeAll(); setTimeout(() => openProduct(id), 260); } });

    $("#accountBody").addEventListener("click", (e) => {
      const t = e.target.closest("[data-acctab]"); if (t) { accTab = t.dataset.acctab; return renderAccount(); }
      if (e.target.closest("#logoutBtn")) { S.Auth.logout(); closeAll(); toast("Вы вышли из аккаунта"); return; }
      if (e.target.closest("#pfSave")) { S.Auth.update({ name: $("#pfName").value.trim() || S.Auth.current().name, phone: $("#pfPhone").value.trim() }); toast("Профиль сохранён", true); return renderAccount(); }
      if (e.target.closest("[data-open]")) { const row = e.target.closest("[data-id]"); if (row) { closeAll(); setTimeout(() => openProduct(+row.dataset.id), 260); return; } }
      const bc = e.target.closest("[data-bcancel]"); if (bc) { const row = e.target.closest("[data-bid]"); S.Bookings.remove(row.dataset.bid); toast("Бронь отменена"); return renderAccount(); }
    });

    window.addEventListener("tj:change", () => { badges(); if ($("#accountDrawer").classList.contains("show")) renderAccount(); if ($("#cartDrawer").classList.contains("show")) renderCart(); });
  }
  function syncPdpWish() { const b = $("#pdpWish"); if (!b) return; const on = S.Wish.has(+b.dataset.id); b.classList.toggle("active", on); b.querySelector("i").className = "ti ti-heart" + (on ? "-filled" : ""); }

  /* =========================================================================
     КАТАЛОГ
     ========================================================================= */
  function initCatalog() {
    renderHeaderNav();
    $("#chips") && ($("#chips").innerHTML = NAV.map((c) => `<button class="chip" data-cat="${c.id}">${c.label}</button>`).join(""));
    const state = { cat: "all", sale: false, sort: "pop", query: "" };
    const params = new URLSearchParams(location.search);
    if (params.get("cat")) state.cat = params.get("cat");
    if (params.get("sale")) state.sale = true;
    if (params.get("q")) { state.query = params.get("q"); const si = $("#searchInput"); if (si) { si.value = state.query; $("#searchBox").classList.add("has-value"); } }

    function filtered() {
      let list = S.Products.all();
      if (state.sale) list = list.filter(S.onSale); else if (state.cat !== "all") list = list.filter((p) => p.cat === state.cat);
      if (state.query) { const q = state.query.toLowerCase(); list = list.filter((p) => (p.name + " " + p.brand).toLowerCase().includes(q)); }
      switch (state.sort) { case "cheap": list.sort((a, b) => S.effPrice(a) - S.effPrice(b)); break; case "exp": list.sort((a, b) => S.effPrice(b) - S.effPrice(a)); break; case "new": list.sort((a, b) => (b.badge === "new") - (a.badge === "new")); break; default: list.sort((a, b) => b.reviews - a.reviews); }
      return list;
    }
    function renderGrid() {
      const list = filtered(), grid = $("#grid"), empty = $("#empty");
      if (!list.length) { grid.innerHTML = ""; empty.hidden = false; } else { empty.hidden = true; grid.innerHTML = list.map(card).join(""); }
      const label = state.sale ? "Распродажа" : catLabel(state.cat);
      $("#resultCount").textContent = `${label} · ${list.length} ${plural(list.length, ["товар", "товара", "товаров"])}`;
      $("#catalogHeading").textContent = label;
      $$(".catnav__item,.chip").forEach((x) => x.classList.toggle("active", x.dataset.cat === state.cat && !state.sale));
    }
    window.__renderGrid = renderGrid;
    window.__setCat = (id) => { state.cat = id; state.sale = false; renderGrid(); window.scrollTo({ top: $("#catalogTop").offsetTop - 80, behavior: "smooth" }); };

    bindCards($("#grid"));
    $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
    const si = $("#searchInput"), sb = $("#searchBox"); let st;
    si.addEventListener("input", () => { sb.classList.toggle("has-value", si.value.length > 0); clearTimeout(st); st = setTimeout(() => { state.query = si.value.trim(); renderGrid(); }, 200); });
    $("#searchClear").addEventListener("click", () => { si.value = ""; state.query = ""; sb.classList.remove("has-value"); renderGrid(); si.focus(); });
    $("#resetFilters") && $("#resetFilters").addEventListener("click", () => { state.cat = "all"; state.sale = false; state.query = ""; si.value = ""; sb.classList.remove("has-value"); renderGrid(); });
    renderGrid();
  }

  /* =========================================================================
     ЛЕНДИНГ
     ========================================================================= */
  function initLanding() {
    renderHeaderNav();
    $("#announceTrack").innerHTML = [
      '<i class="ti ti-truck"></i> Бесплатная доставка по Душанбе от 500 сомони',
      '<i class="ti ti-cash"></i> Оплата при получении',
      '<i class="ti ti-rosette-discount"></i> Скидки до 25% на летнюю коллекцию',
      '<i class="ti ti-clock-hour-4"></i> Работаем ежедневно 9:00–21:00',
    ].map((t) => `<span>${t}</span>`).join("").repeat(2);

    // витрина категорий с фото
    $("#showcase").innerHTML = S.CATEGORIES.map((c) => {
      const items = S.Products.inCat(c.id);
      const p = items.find((x) => x.colors && x.colors[0] && x.colors[0].img);
      const bg = p ? `<img src="${S.imgPath(p.colors[0].img)}" alt="${esc(c.label)}" loading="lazy">` : "";
      return `<a class="show-tile" href="${catalogUrl({ cat: c.id })}"><div class="show-tile__img">${bg}</div><div class="show-tile__cap"><b>${esc(c.label)}</b><span>${items.length} ${plural(items.length, ["модель", "модели", "моделей"])} <i class="ti ti-arrow-right"></i></span></div></a>`;
    }).join("");

    // хиты продаж
    function renderFeatured() {
      const list = S.Products.all().slice().sort((a, b) => b.reviews - a.reviews).slice(0, 8);
      $("#featured").innerHTML = list.map(card).join("");
    }
    window.__renderFeatured = renderFeatured;
    renderFeatured();
    bindCards($("#featured"));

    // отзывы
    const R = [
      { n: "Алишер Р.", t: "Заказывал лоферы — качество замши супер, привезли в тот же день. Беру не первый раз!", r: 5 },
      { n: "Фаррух М.", t: "Футболки Polo сидят отлично, ткань плотная. Цены честные, советую друзьям.", r: 5 },
      { n: "Джамшед К.", t: "Поло-зипер взял в трёх цветах. Менеджер помог с размером, всё чётко. Спасибо!", r: 5 },
      { n: "Рустам А.", t: "Магазин в «Анисе» удобно расположен, выбор большой. Шлёпки кожаные топ за свои деньги.", r: 4 },
    ];
    $("#reviewsGrid").innerHTML = R.map((x) => `<div class="review"><div class="review__stars">${"★".repeat(x.r)}<span class="muted">${"★".repeat(5 - x.r)}</span></div><p>${esc(x.t)}</p><div class="review__author"><span class="ava">${esc(x.n[0])}</span><b>${esc(x.n)}</b></div></div>`).join("");

    // коллаж «о магазине»
    $("#aboutMedia") && ($("#aboutMedia").innerHTML = ["p02", "p35", "p49", "p07"].map((n) => `<div class="about__cell"><img src="images/${n}.jpg" alt="TAJSHOP" loading="lazy"></div>`).join(""));
  }

  /* ---------- Старт ---------- */
  injectUI();
  renderMobileMenu();
  wireHeader();
  bindGlobal();
  if (PAGE === "catalog") initCatalog(); else initLanding();
  badges();
})();
