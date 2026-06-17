/* ==========================================================================
   TAJSHOP — админ-панель
   ========================================================================== */
(function () {
  "use strict";
  const S = window.Store;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const cur = S.SHOP.currency;
  const typeByCat = { obuv: "loafer", shlepki: "slipper", futbolki: "tshirt", polo: "polo", bryuki: "pants" };
  const IMG_OPTS = Array.from({ length: 60 }, (_, i) => `p${String(i + 1).padStart(2, "0")}`);

  function toast(msg, ok) {
    const el = document.createElement("div");
    el.className = "toast" + (ok ? " toast--ok" : "");
    el.innerHTML = `<i class="ti ${ok ? "ti-circle-check" : "ti-info-circle"}"></i> ${msg}`;
    $("#toastWrap").appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 2400);
  }

  /* ---------- Вход ---------- */
  function initLogin() {
    const tryLogin = () => {
      if (S.Admin.login($("#adPass").value)) showShell();
      else { $("#adErr").textContent = "Неверный пароль"; $("#adErr").hidden = false; }
    };
    $("#adLoginBtn").addEventListener("click", tryLogin);
    $("#adPass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  }
  function showShell() {
    $("#adminLogin").style.display = "none";
    $("#adminShell").hidden = false;
    nav("dashboard");
  }

  /* ---------- Роутер ---------- */
  let view = "dashboard";
  const titles = { dashboard: ["Дашборд", "Обзор магазина"], products: ["Товары", "Каталог и наличие"], orders: ["Заказы", "Заказы покупателей"], promos: ["Акции", "Временные скидки"], customers: ["Клиенты", "Зарегистрированные покупатели"] };
  function nav(v) {
    view = v;
    $$(".aside__item[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    $("#viewTitle").textContent = titles[v][0];
    $("#viewSub").textContent = titles[v][1];
    $(".aside").classList.remove("open");
    render();
  }
  function render() {
    $("#topActions").innerHTML = (view === "products")
      ? `<button class="btn btn--primary" id="addProd"><i class="ti ti-plus"></i> Добавить товар</button>` : "";
    ({ dashboard: renderDashboard, products: renderProducts, orders: renderOrders, promos: renderPromos, customers: renderCustomers }[view])();
  }

  /* ---------- Дашборд ---------- */
  function renderDashboard() {
    const products = S.Products.all(), orders = S.Orders.all(), users = S.Auth.users();
    const low = products.filter((p) => (p.stock || 0) <= 10);
    const newOrders = orders.filter((o) => o.status === "new").length;
    $("#adminView").innerHTML = `
      <div class="stats">
        <div class="stat"><div class="stat__ic i1"><i class="ti ti-shirt"></i></div><b>${products.length}</b><span>товаров в каталоге</span></div>
        <div class="stat"><div class="stat__ic i2"><i class="ti ti-package"></i></div><b>${orders.length}</b><span>заказов · ${newOrders} новых</span></div>
        <div class="stat"><div class="stat__ic i3"><i class="ti ti-cash"></i></div><b>${fmt(S.Orders.revenue())} ${cur}</b><span>выручка</span></div>
        <div class="stat"><div class="stat__ic i4"><i class="ti ti-users"></i></div><b>${users.length}</b><span>клиентов</span></div>
      </div>
      <div class="panel">
        <div class="panel__head"><h3>Последние заказы</h3><button class="btn btn--ghost btn--xs" data-goto="orders">Все заказы</button></div>
        ${orders.length ? `<table class="tbl"><thead><tr><th>Заказ</th><th>Клиент</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
          ${orders.slice(0, 5).map((o) => `<tr><td><b>${o.id}</b></td><td>${esc(o.name)}<span style="color:var(--muted);font-size:12px;display:block">${esc(o.phone)}</span></td><td><b>${fmt(o.total)} ${cur}</b></td><td>${statusPill(o.status)}</td></tr>`).join("")}
        </tbody></table>` : emptyBox("ti-package", "Заказов пока нет")}
      </div>
      <div class="panel">
        <div class="panel__head"><h3>Заканчивается на складе</h3><button class="btn btn--ghost btn--xs" data-goto="products">К товарам</button></div>
        ${low.length ? `<table class="tbl"><thead><tr><th>Товар</th><th>Категория</th><th>Остаток</th></tr></thead><tbody>
          ${low.map((p) => `<tr><td>${prodCell(p)}</td><td>${catName(p.cat)}</td><td><span class="pill pill--low">${p.stock || 0} шт</span></td></tr>`).join("")}
        </tbody></table>` : emptyBox("ti-circle-check", "Со складом всё в порядке")}
      </div>`;
  }

  /* ---------- Товары ---------- */
  function renderProducts() {
    const products = S.Products.all();
    $("#adminView").innerHTML = `<div class="panel">
      <table class="tbl"><thead><tr><th>Товар</th><th>Категория</th><th>Цвета</th><th>Цена</th><th>Остаток</th><th>Статус</th><th></th></tr></thead>
      <tbody>${products.map((p) => `<tr>
        <td>${prodCell(p)}</td>
        <td>${catName(p.cat)}</td>
        <td><div class="tbl-thumbs">${(p.colors || []).slice(0, 5).map((c) => `<span style="background:${c.hex}" title="${esc(c.name)}"></span>`).join("")}</div></td>
        <td><b>${fmt(S.effPrice(p))} ${cur}</b>${S.oldPriceOf(p) ? `<span style="color:var(--muted);text-decoration:line-through;font-size:12px;display:block">${fmt(S.oldPriceOf(p))}</span>` : ""}</td>
        <td><span class="pill ${(p.stock || 0) <= 10 ? "pill--low" : "pill--gray"}">${p.stock || 0} шт</span></td>
        <td>${S.onSale(p) ? `<span class="pill pill--red">−${S.discountPct(p)}%</span>` : p.badge === "new" ? '<span class="pill pill--green">New</span>' : p.badge === "hit" ? '<span class="pill pill--orange">Хит</span>' : '<span class="pill pill--gray">—</span>'}</td>
        <td><div class="tcell-actions"><button class="iconbtn" data-edit="${p.id}" title="Изменить"><i class="ti ti-edit"></i></button><button class="iconbtn danger" data-del="${p.id}" title="Удалить"><i class="ti ti-trash"></i></button></div></td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  /* ---------- Заказы ---------- */
  const ORD_STATUS = [["new", "Новый"], ["confirmed", "Подтверждён"], ["delivered", "Доставлен"], ["cancelled", "Отменён"]];
  function renderOrders() {
    const orders = S.Orders.all();
    $("#adminView").innerHTML = orders.length ? `<div class="panel">
      <table class="tbl"><thead><tr><th>Заказ</th><th>Дата</th><th>Клиент</th><th>Состав</th><th>Сумма</th><th>Статус</th></tr></thead>
      <tbody>${orders.map((o) => `<tr>
        <td><b>${o.id}</b></td>
        <td>${new Date(o.date).toLocaleDateString("ru-RU")}<span style="color:var(--muted);font-size:12px;display:block">${new Date(o.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span></td>
        <td>${esc(o.name)}<span style="color:var(--muted);font-size:12px;display:block">${esc(o.phone)}</span></td>
        <td><span class="order-items-mini">${o.items.map((i) => esc(i.name) + " ×" + i.qty).join(", ")}</span></td>
        <td><b>${fmt(o.total)} ${cur}</b></td>
        <td><select class="mini" data-ostatus="${o.id}">${ORD_STATUS.map(([v, l]) => `<option value="${v}"${o.status === v ? " selected" : ""}>${l}</option>`).join("")}</select></td>
      </tr>`).join("")}</tbody></table></div>` : `<div class="panel">${emptyBox("ti-package", "Заказов пока нет", "Заказы из магазина появятся здесь")}</div>`;
  }

  /* ---------- Акции ---------- */
  function renderPromos() {
    const products = S.Products.all();
    $("#adminView").innerHTML = `<div class="panel">
      <div class="panel__head"><h3>Временные акции</h3><span style="font-size:13px;color:var(--muted)">Задайте скидку и срок — на витрине появится таймер</span></div>
      <table class="tbl"><thead><tr><th>Товар</th><th>Цена</th><th>Скидка %</th><th>Срок (дней)</th><th>Статус</th><th></th></tr></thead>
      <tbody>${products.map((p) => {
        const active = S.saleActive(p);
        const left = active ? Math.ceil((p.sale.until - Date.now()) / 864e5) : "";
        return `<tr data-prow="${p.id}">
          <td>${prodCell(p)}</td>
          <td><b>${fmt(p.price)} ${cur}</b></td>
          <td><input class="mini" type="number" min="0" max="90" style="width:70px" data-ppercent value="${active ? p.sale.percent : (p.oldPrice ? S.discountPct(p) : 15)}"></td>
          <td><input class="mini" type="number" min="1" max="60" style="width:70px" data-pdays value="${active ? Math.max(1, left) : 3}"></td>
          <td>${active ? `<span class="pill pill--red">−${p.sale.percent}%</span> <span class="countdown">ещё ${left} дн</span>` : '<span class="pill pill--gray">нет</span>'}</td>
          <td><div class="tcell-actions">
            <button class="iconbtn" data-papply="${p.id}" title="Запустить акцию"><i class="ti ti-rocket"></i></button>
            ${active ? `<button class="iconbtn danger" data-pstop="${p.id}" title="Остановить"><i class="ti ti-x"></i></button>` : ""}
          </div></td>
        </tr>`;
      }).join("")}</tbody></table></div>`;
  }

  /* ---------- Клиенты ---------- */
  function renderCustomers() {
    const users = S.Auth.users();
    $("#adminView").innerHTML = users.length ? `<div class="panel">
      <table class="tbl"><thead><tr><th>Клиент</th><th>E-mail</th><th>Телефон</th><th>Заказов</th><th>Регистрация</th></tr></thead>
      <tbody>${users.map((u) => `<tr>
        <td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${esc(u.phone || "—")}</td>
        <td>${S.Orders.byUser(u.email).length}</td>
        <td>${new Date(u.joined).toLocaleDateString("ru-RU")}</td>
      </tr>`).join("")}</tbody></table></div>` : `<div class="panel">${emptyBox("ti-users", "Клиентов пока нет", "Зарегистрированные в магазине покупатели появятся здесь")}</div>`;
  }

  /* ---------- Хелперы рендера ---------- */
  function prodCell(p) {
    const img = (p.colors && p.colors[0] && p.colors[0].img) ? `<img class="tbl__img" src="${S.imgPath(p.colors[0].img)}" alt="">` : `<span class="tbl__img"></span>`;
    return `<div style="display:flex;align-items:center;gap:12px">${img}<div class="tbl__name"><b>${esc(p.name)}</b><span>${esc(p.brand)}</span></div></div>`;
  }
  const catName = (id) => (S.CATEGORIES.find((c) => c.id === id) || {}).label || id;
  function statusPill(s) { const m = { new: ["pill--orange", "Новый"], confirmed: ["pill--gray", "Подтверждён"], delivered: ["pill--green", "Доставлен"], cancelled: ["pill--red", "Отменён"] }[s] || ["pill--gray", s]; return `<span class="pill ${m[0]}">${m[1]}</span>`; }
  function emptyBox(icon, t, s) { return `<div class="empty-box"><i class="ti ${icon}"></i><p>${t}</p>${s ? `<small style="color:var(--muted)">${s}</small>` : ""}</div>`; }

  /* ---------- Редактор товара ---------- */
  function blankProduct() { return { id: null, name: "", brand: "TAJSHOP", cat: "futbolki", price: 0, oldPrice: 0, stock: 10, badge: "", rating: 4.8, reviews: 0, sizes: ["S", "M", "L", "XL"], colors: [{ name: "Чёрный", hex: "#1C1C1C", img: "" }], desc: "" }; }
  let editing = null;
  function openEditor(id) {
    editing = id ? clone(S.Products.get(id)) : blankProduct();
    const p = editing;
    $("#prodModalInner").innerHTML = `
      <button class="icon-btn modal__close" data-pclose><i class="ti ti-x"></i></button>
      <div class="prodform">
        <h3>${id ? "Изменить товар" : "Новый товар"}</h3>
        <div class="form-grid">
          <div class="field full"><label>Название</label><input id="fName" value="${esc(p.name)}" placeholder="Например: Лоферы замшевые"></div>
          <div class="field"><label>Бренд</label><input id="fBrand" value="${esc(p.brand)}"></div>
          <div class="field"><label>Категория</label><select id="fCat">${S.CATEGORIES.map((c) => `<option value="${c.id}"${p.cat === c.id ? " selected" : ""}>${c.label}</option>`).join("")}</select></div>
          <div class="field"><label>Цена, ${cur}</label><input id="fPrice" type="number" min="0" value="${p.price || ""}"></div>
          <div class="field"><label>Старая цена (для скидки)</label><input id="fOld" type="number" min="0" value="${p.oldPrice || ""}"></div>
          <div class="field"><label>Остаток на складе</label><input id="fStock" type="number" min="0" value="${p.stock || 0}"></div>
          <div class="field"><label>Метка</label><select id="fBadge"><option value=""${!p.badge ? " selected" : ""}>Нет</option><option value="new"${p.badge === "new" ? " selected" : ""}>New (новинка)</option><option value="hit"${p.badge === "hit" ? " selected" : ""}>Хит</option></select></div>
          <div class="field full"><label>Размеры (через запятую)</label><input id="fSizes" value="${esc((p.sizes || []).join(", "))}" placeholder="S, M, L, XL"></div>
          <div class="field full"><label>Описание</label><textarea id="fDesc" placeholder="Короткое описание товара">${esc(p.desc)}</textarea></div>
          <div class="field full"><label>Цвета и фото</label><div class="colors-edit" id="colorsEdit"></div>
            <button class="color-add" id="addColor"><i class="ti ti-plus"></i> Добавить цвет</button>
          </div>
        </div>
        <div class="prodform__foot">
          <button class="btn btn--ghost" data-pclose>Отмена</button>
          <button class="btn btn--primary" id="saveProd"><i class="ti ti-device-floppy"></i> ${id ? "Сохранить" : "Создать товар"}</button>
        </div>
      </div>`;
    renderColorRows();
    openProdModal();
  }
  function renderColorRows() {
    $("#colorsEdit").innerHTML = editing.colors.map((c, i) => colorRow(c, i)).join("");
  }
  function colorRow(c, i) {
    const src = c.img ? S.imgPath(c.img) : "";
    const isData = c.img && c.img.startsWith("data:");
    return `<div class="color-row" data-crow="${i}">
      <img class="color-row__thumb" src="${src}" alt="" ${src ? "" : 'style="opacity:.3"'}>
      <input type="text" data-cname value="${esc(c.name)}" placeholder="Название цвета">
      <input type="color" data-chex value="${c.hex || "#1c1c1c"}">
      <select data-cimg>
        <option value="">— фото —</option>
        ${IMG_OPTS.map((n) => `<option value="${n}"${c.img === n ? " selected" : ""}>Фото ${n.slice(1)}</option>`).join("")}
        ${isData ? `<option value="__data" selected>Загруженное фото</option>` : ""}
      </select>
      <div class="tcell-actions">
        <label class="iconbtn" title="Загрузить фото"><i class="ti ti-upload"></i><input type="file" accept="image/*" data-cupload hidden></label>
        <button class="iconbtn danger" data-crm="${i}" title="Удалить цвет"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }
  function readColors() {
    return $$("#colorsEdit .color-row").map((row) => {
      const i = +row.dataset.crow;
      const name = $("[data-cname]", row).value.trim() || "Цвет";
      const hex = $("[data-chex]", row).value;
      const sel = $("[data-cimg]", row).value;
      let img = editing.colors[i] ? editing.colors[i].img : "";
      if (sel && sel !== "__data") img = sel;        // выбрано из списка
      else if (sel === "") img = img && img.startsWith("data:") ? img : ""; // оставить загруженное, если было
      return { name, hex, img };
    });
  }
  function saveProduct() {
    const colors = readColors().filter((c) => c.name);
    const sizes = $("#fSizes").value.split(",").map((s) => s.trim()).filter(Boolean);
    const p = editing;
    p.name = $("#fName").value.trim();
    p.brand = $("#fBrand").value.trim() || "TAJSHOP";
    p.cat = $("#fCat").value;
    p.type = typeByCat[p.cat] || "tshirt";
    p.price = +$("#fPrice").value || 0;
    p.oldPrice = +$("#fOld").value || 0;
    p.stock = +$("#fStock").value || 0;
    p.badge = $("#fBadge").value;
    p.sizes = sizes.length ? sizes : ["Один размер"];
    p.desc = $("#fDesc").value.trim();
    p.colors = colors.length ? colors : [{ name: "Чёрный", hex: "#1C1C1C", img: "" }];
    if (!p.name) { toast("Введите название товара"); $("#fName").focus(); return; }
    if (!p.price) { toast("Укажите цену"); $("#fPrice").focus(); return; }
    S.Products.save(p);
    closeProdModal();
    toast(p.id ? "Товар сохранён" : "Товар добавлен", true);
    render();
  }

  function openProdModal() { $("#prodModal").classList.add("show"); $("#adOverlay").classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeProdModal() { $("#prodModal").classList.remove("show"); $("#adOverlay").classList.remove("show"); document.body.style.overflow = ""; }

  /* ---------- События ---------- */
  function bind() {
    $("#asideNav").addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) nav(b.dataset.view); });
    $("#adBurger").addEventListener("click", () => $(".aside").classList.toggle("open"));
    $("#adLogout").addEventListener("click", () => { S.Admin.logout(); location.reload(); });

    $("#adminView").addEventListener("click", (e) => {
      const goto = e.target.closest("[data-goto]"); if (goto) return nav(goto.dataset.goto);
      const ed = e.target.closest("[data-edit]"); if (ed) return openEditor(+ed.dataset.edit);
      const del = e.target.closest("[data-del]"); if (del) { if (confirm("Удалить этот товар?")) { S.Products.remove(+del.dataset.del); toast("Товар удалён"); render(); } return; }
      const ap = e.target.closest("[data-papply]"); if (ap) {
        const row = e.target.closest("[data-prow]");
        const percent = +$("[data-ppercent]", row).value, days = +$("[data-pdays]", row).value || 1;
        if (percent <= 0) return toast("Укажите скидку больше 0");
        const p = S.Products.get(+ap.dataset.papply); p.sale = { percent, until: Date.now() + days * 864e5 }; S.Products.save(p);
        toast(`Акция −${percent}% запущена на ${days} дн`, true); render(); return;
      }
      const stop = e.target.closest("[data-pstop]"); if (stop) { const p = S.Products.get(+stop.dataset.pstop); delete p.sale; S.Products.save(p); toast("Акция остановлена"); render(); return; }
    });
    $("#adminView").addEventListener("change", (e) => {
      const os = e.target.closest("[data-ostatus]"); if (os) { S.Orders.update(os.dataset.ostatus, { status: os.value }); toast("Статус заказа обновлён", true); }
    });

    $("#topActions").addEventListener("click", (e) => { if (e.target.closest("#addProd")) openEditor(null); });

    $("#prodModalInner").addEventListener("click", (e) => {
      if (e.target.closest("[data-pclose]")) return closeProdModal();
      if (e.target.closest("#saveProd")) return saveProduct();
      if (e.target.closest("#addColor")) { editing.colors = readColors(); editing.colors.push({ name: "Новый цвет", hex: "#888888", img: "" }); renderColorRows(); return; }
      const rm = e.target.closest("[data-crm]"); if (rm) { editing.colors = readColors(); editing.colors.splice(+rm.dataset.crm, 1); if (!editing.colors.length) editing.colors.push({ name: "Чёрный", hex: "#1C1C1C", img: "" }); renderColorRows(); return; }
    });
    $("#prodModalInner").addEventListener("change", (e) => {
      const sel = e.target.closest("[data-cimg]");
      if (sel) { const row = e.target.closest(".color-row"); const thumb = $(".color-row__thumb", row); if (sel.value && sel.value !== "__data") { thumb.src = S.imgPath(sel.value); thumb.style.opacity = "1"; } return; }
      const up = e.target.closest("[data-cupload]");
      if (up && up.files[0]) {
        const row = e.target.closest(".color-row"); const i = +row.dataset.crow;
        const reader = new FileReader();
        reader.onload = () => { editing.colors = readColors(); editing.colors[i].img = reader.result; renderColorRows(); toast("Фото загружено", true); };
        reader.readAsDataURL(up.files[0]);
      }
    });
    $("#adOverlay").addEventListener("click", closeProdModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProdModal(); });
  }

  /* ---------- Старт ---------- */
  initLogin();
  bind();
  if (S.Admin.isAuthed()) showShell();
})();
