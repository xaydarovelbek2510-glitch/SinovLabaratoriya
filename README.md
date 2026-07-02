# Qurilish Sinov Laboratoriyasi — veb-sayt

Yo'l va qurilish materiallari sinov laboratoriyasi uchun ikki tilli (O'zbek / Rus) tanishtiruv sayti. Docker orqali ishga tushiriladi.

## Tarkibi

- **Tanishtiruv sahifasi** — xizmatlar, akkreditatsiya ma'lumoti, aloqa
- **Onlayn ariza formasi** — mijozlar sinovga ariza qoldirishi mumkin
- **Sertifikat/natija tekshirish** — sertifikat raqami bo'yicha ochiq tekshirish
- **Admin panel** (`/admin.html`) — sinov natijalarini kiritish va arizalarni ko'rish

## Texnologiyalar

- Backend: Node.js + Express + PostgreSQL
- Frontend: statik HTML/CSS/JS (build kerak emas)
- Docker Compose: `db` (PostgreSQL), `backend` (API + sayt), `adminer` (ma'lumotlar bazasini ko'rish uchun ixtiyoriy)

## Ishga tushirish

1. `.env` faylini yarating:

```bash
cp .env.example .env
```

`.env` faylini ochib, **`ADMIN_PASSWORD`** va **`JWT_SECRET`** qiymatlarini albatta o'zgartiring.

2. Konteynerlarni ishga tushiring:

```bash
docker compose up -d --build
```

3. Brauzerda oching:

- Sayt: **http://localhost:4000**
- Admin panel: **http://localhost:4000/admin.html** (`.env` dagi `ADMIN_PASSWORD` bilan kiring)
- Adminer (DB ko'rish): **http://localhost:8081** (server: `db`, user/parol — `.env` dagi qiymatlar)

## Muhim eslatmalar

- Saytdagi barcha matn, standart raqamlari (GOST, O'zDSt, ShNQ), manzil, telefon va akkreditatsiya sertifikat raqami — **namuna/placeholder** ma'lumotlar. Real ishga tushirishdan oldin ularni o'z laboratoriyangizning haqiqiy ma'lumotlari bilan almashtiring:
  - `backend/public/index.html` — matnlar (uz)
  - `backend/public/js/i18n.js` — matnlar (uz/ru)
- Admin autentifikatsiyasi sodda (bitta umumiy parol + JWT). Agar sayt haqiqiy internetga chiqariladigan bo'lsa, HTTPS (masalan, Nginx + Let's Encrypt orqali) va kuchliroq parol siyosati qo'shish tavsiya etiladi.
- Ma'lumotlar bazasi konteyner o'chirilganda ham saqlanadi (`db_data` volume orqali).

## Foydali buyruqlar

```bash
# Loglarni ko'rish
docker compose logs -f backend

# To'xtatish
docker compose down

# To'xtatish va ma'lumotlar bazasini ham o'chirish
docker compose down -v

# Qayta build qilish (kod o'zgartirilgandan keyin)
docker compose up -d --build
```
