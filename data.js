/* ==========================================================================
   TAJSHOP — стартовые данные (каталог, категории, контакты).
   Это «семена»: при первом запуске они загружаются в хранилище (store.js),
   после чего товары можно менять/добавлять/удалять в админ-панели.
   Фото товаров лежат в папке images/ (p01.jpg … p60.jpg).
   ========================================================================== */

const SHOP = {
  name: "TAJSHOP",
  tagline: "Хорошее качество и доступная цена",
  city: "Душанбе",
  address: "Дом Печати, ТЦ «Аниса», 1 этаж (рядом с Шоколадницей, ТЦ Ситора)",
  hours: "Ежедневно 9:00 – 21:00",
  phone: "+992 200-44-2222",
  phone2: "+992 92 611 22 99",
  telegram: "https://t.me/tajshopmagazin",
  telegramName: "@tajshopmagazin",
  instagram: "https://instagram.com/magazin1.nav",
  instagramName: "magazin1.nav",
  currency: "с.",
  freeDeliveryFrom: 500,
  founded: 2019,
};

/* Палитра цветов (название -> hex) */
const COL = {
  black:  "#1C1C1C", brown: "#6B4A2B", dbrown: "#4A3422", tan: "#B07A45",
  navy:   "#27384F", dnavy: "#1E2A3A", gray: "#8A8A86", olive: "#56583B",
  green:  "#3B5D3A", white: "#EDEAE3", beige: "#CDB79E", bordo: "#6E2233",
  stripe: "#5A5A5A",
};

/* Категории (как в их Instagram-хайлайтах) */
const CATEGORIES = [
  { id: "obuv",     label: "Обувь",          icon: "ti-shoe" },
  { id: "shlepki",  label: "Шлёпки",         icon: "ti-shoe" },
  { id: "futbolki", label: "Футболки",       icon: "ti-shirt" },
  { id: "polo",     label: "Тенниски",       icon: "ti-shirt" },
  { id: "bryuki",   label: "Брюки и бриджи", icon: "ti-hanger" },
];

/* Хелпер для цвета: c("Коричневый", "brown", "p02") */
const c = (name, key, img) => ({ name, hex: COL[key], img });

/* Товары. type — запасной силуэт, если у товара нет фото (для новых из админки). */
const PRODUCTS = [
  /* ── Обувь ─────────────────────────────────────────── */
  { id: 1, name: "Лоферы замшевые", brand: "Loro Piana", cat: "obuv", type: "loafer",
    price: 1200, rating: 4.9, reviews: 184, stock: 24,
    sale: { percent: 25, until: Date.now() + 3 * 864e5 },
    colors: [c("Коричневый","brown","p02"), c("Синий","navy","p04")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Мужские лоферы из натуральной замши. Мягкая подошва, посадка по ноге, премиальный вид." },

  { id: 2, name: "Слипоны перфорированные", brand: "Loro Piana", cat: "obuv", type: "loafer",
    price: 870, badge: "new", rating: 4.8, reviews: 73, stock: 16,
    colors: [c("Синий","navy","p03")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Лёгкие летние слипоны с перфорацией — дышащие и удобные в жару." },

  { id: 3, name: "Мюли замшевые с пряжкой", brand: "LV style", cat: "obuv", type: "loafer",
    price: 850, badge: "hit", rating: 4.9, reviews: 142, stock: 19,
    colors: [c("Коричневый","brown","p09"), c("Тёмно-кор.","dbrown","p10")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Мюли без задника с фирменной пряжкой. Хит сезона — статусно и удобно." },

  { id: 4, name: "Мюли замшевые", brand: "Loro Piana", cat: "obuv", type: "loafer",
    price: 780, rating: 4.7, reviews: 58, stock: 12,
    colors: [c("Коричневый","brown","p12")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Замшевые мюли с мягкой стелькой. Лёгкие, для города и отдыха." },

  { id: 5, name: "Слипоны кожаные", brand: "Hermès style", cat: "obuv", type: "loafer",
    price: 980, rating: 4.8, reviews: 64, stock: 9,
    colors: [c("Синий","navy","p13")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Классические слипоны с аккуратным силуэтом. Универсальная модель." },

  { id: 6, name: "Мюли на платформе", brand: "Hermès style", cat: "obuv", type: "loafer",
    price: 820, badge: "new", rating: 4.6, reviews: 37, stock: 14,
    colors: [c("Белый","white","p11")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Светлые мюли на удобной платформе. Лёгкие и яркие для лета." },

  /* ── Шлёпки ────────────────────────────────────────── */
  { id: 7, name: "Шлёпки кожаные DG", brand: "DG style", cat: "shlepki", type: "slipper",
    price: 520, oldPrice: 520, rating: 4.8, reviews: 158, stock: 40,
    sale: { percent: 19, until: Date.now() + 5 * 864e5 },
    colors: [c("Серый","gray","p05"), c("Чёрный","black","p06"), c("Коричневый","brown","p07"), c("Бежевый","beige","p08")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Кожаные шлёпки с тиснёным логотипом. Мягкая стелька, не скользят." },

  { id: 8, name: "Шлёпки замшевые", brand: "Loro Piana", cat: "shlepki", type: "slipper",
    price: 380, badge: "hit", rating: 4.9, reviews: 121, stock: 33,
    colors: [c("Коричневый","brown","p14")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Замшевые шлёпки премиум-класса. Ортопедическая стелька, лёгкие." },

  { id: 9, name: "Шлёпки замшевые синие", brand: "TAJSHOP", cat: "shlepki", type: "slipper",
    price: 360, rating: 4.7, reviews: 64, stock: 28,
    colors: [c("Синий","navy","p15")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Удобные замшевые шлёпки. Дышащая перемычка, мягкая подошва." },

  { id: 10, name: "Шлёпки белые летние", brand: "TAJSHOP", cat: "shlepki", type: "slipper",
    price: 350, rating: 4.5, reviews: 41, stock: 22,
    colors: [c("Белый","white","p16")],
    sizes: ["40","41","42","43","44","45"],
    desc: "Светлые универсальные шлёпки. Подойдут под любой летний образ." },

  /* ── Футболки ──────────────────────────────────────── */
  { id: 11, name: "Футболка базовая premium", brand: "TAJSHOP", cat: "futbolki", type: "tshirt",
    price: 160, rating: 4.7, reviews: 203, stock: 60,
    colors: [c("Белый","white","p24"), c("Чёрный","black","p23"), c("Синий","navy","p25"), c("Зелёный","green","p27")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "База на каждый день из плотного хлопка. Держит форму, большой выбор цветов." },

  { id: 12, name: "Футболка с принтом «Лошадь»", brand: "TAJSHOP", cat: "futbolki", type: "tshirt",
    price: 240, badge: "new", rating: 4.7, reviews: 88, stock: 35,
    colors: [c("Белый","white","p30"), c("Синий","navy","p29"), c("Чёрный","black","p31")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Хлопковая футболка с вышитым принтом. Не теряет цвет после стирки." },

  { id: 13, name: "Футболка Enrico Cerini", brand: "Enrico Cerini", cat: "futbolki", type: "tshirt",
    price: 280, oldPrice: 280, rating: 4.9, reviews: 211, stock: 42,
    sale: { percent: 21, until: Date.now() + 4 * 864e5 },
    colors: [c("Белый","white","p35"), c("Чёрный","black","p36")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Премиальный хлопок, аккуратный логотип. Самая популярная модель магазина." },

  { id: 14, name: "Футболка с принтом", brand: "Marcelo", cat: "futbolki", type: "tshirt",
    price: 230, rating: 4.7, reviews: 76, stock: 31,
    colors: [c("Белый","white","p42"), c("Чёрный","black","p41"), c("Зелёный","green","p43")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Дизайнерский принт спереди, мягкий материал. Яркий акцент для образа." },

  { id: 15, name: "Футболка Polo Ralph Lauren", brand: "Polo R.L.", cat: "futbolki", type: "tshirt",
    price: 280, badge: "hit", rating: 4.9, reviews: 176, stock: 38,
    colors: [c("Белый","white","p38"), c("Чёрный","black","p39"), c("Бордовый","bordo","p40")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Хлопковая футболка с вышитым логотипом. Классика на каждый день." },

  { id: 16, name: "Футболка в полоску", brand: "TAJSHOP", cat: "futbolki", type: "tshirt",
    price: 210, rating: 4.6, reviews: 54, stock: 27,
    colors: [c("Белый","white","p44"), c("Синий","navy","p46"), c("Полоска","stripe","p45")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Лёгкая футболка с контрастными полосами на груди. Дышащий хлопок." },

  { id: 17, name: "Футболка зелёная", brand: "Marcelo", cat: "futbolki", type: "tshirt",
    price: 230, rating: 4.7, reviews: 49, stock: 24,
    colors: [c("Зелёный","green","p32"), c("Синий","navy","p33")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Насыщенный цвет, плотный трикотаж. Садится по фигуре." },

  /* ── Тенниски / Поло ───────────────────────────────── */
  { id: 18, name: "Поло-зипер", brand: "TAJSHOP", cat: "polo", type: "polo",
    price: 310, badge: "new", rating: 4.8, reviews: 132, stock: 29,
    colors: [c("Коричневый","brown","p49"), c("Синий","navy","p50"), c("Белый","white","p51")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Поло на молнии, трикотаж-рубчик. Современный крой, держит форму." },

  { id: 19, name: "Поло классическое пике", brand: "TAJSHOP", cat: "polo", type: "polo",
    price: 290, rating: 4.7, reviews: 98, stock: 36,
    colors: [c("Белый","white","p52"), c("Чёрный","black","p53")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Классическое поло пике с вышитым логотипом. Воротник держит форму." },

  { id: 20, name: "Поло в полоску", brand: "TAJSHOP", cat: "polo", type: "polo",
    price: 320, rating: 4.7, reviews: 61, stock: 21,
    colors: [c("Белый","white","p47"), c("Полоска","stripe","p48")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Поло с контрастными полосами. Лёгкий хлопок для жаркого дня." },

  { id: 21, name: "Поло однотонное", brand: "TAJSHOP", cat: "polo", type: "polo",
    price: 300, rating: 4.6, reviews: 47, stock: 25,
    colors: [c("Коричневый","tan","p56"), c("Синий","navy","p55")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Лаконичное поло из мягкого трикотажа. Универсальный цвет под любой низ." },

  { id: 22, name: "Поло-зипер светлое", brand: "TAJSHOP", cat: "polo", type: "polo",
    price: 330, badge: "hit", rating: 4.8, reviews: 89, stock: 18,
    colors: [c("Бежевый","beige","p59"), c("Белый","white","p57"), c("Чёрный","black","p60")],
    sizes: ["S","M","L","XL","XXL"],
    desc: "Поло на молнии в светлой гамме. Премиальный вид, садится по фигуре." },

  /* ── Брюки и бриджи ────────────────────────────────── */
  { id: 23, name: "Брюки летние casual", brand: "TAJSHOP", cat: "bryuki", type: "pants",
    price: 340, badge: "new", rating: 4.7, reviews: 58, stock: 26,
    colors: [c("Серый","gray","p20"), c("Оливковый","olive","p21")],
    sizes: ["30","32","34","36","38"],
    desc: "Лёгкие летние брюки прямого кроя. Дышащая ткань, почти не мнётся." },

  { id: 24, name: "Брюки спортивные", brand: "TAJSHOP", cat: "bryuki", type: "pants",
    price: 290, rating: 4.6, reviews: 44, stock: 30,
    colors: [c("Тёмный","dnavy","p22")],
    sizes: ["30","32","34","36","38"],
    desc: "Удобные спортивные брюки на каждый день. Мягкий трикотаж, манжеты внизу." },
];
