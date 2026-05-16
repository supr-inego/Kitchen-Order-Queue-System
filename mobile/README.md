# Crammer's Restaurant — Mobile App (Expo)

React Native / Expo client for the **Kitchen Restaurant System v3** Django backend. Uses the **same database, users, products, orders, and coupons** as the web app.

## Shared backend

| Feature | Mobile | Web |
|---------|--------|-----|
| Login (JWT) | ✅ | ✅ |
| Same email/password | ✅ | ✅ |
| Products (menu) | ✅ | ✅ |
| Place orders + coupons | ✅ | ✅ |
| My orders (live poll) | ✅ | ✅ |
| Admin queue & orders | ✅ | ✅ |

## Prerequisites

1. **Backend running** (from project root):

```bash
cd backend
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

`0.0.0.0` allows phones and emulators on your LAN to connect.

2. **Node.js 18+** and npm.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and set your PC's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000/api
```

Find IP: `ipconfig` (Windows) → IPv4 Address.

### Emulator defaults (no `.env`)

| Device | API URL |
|--------|---------|
| Android emulator | `http://10.0.2.2:8000/api` |
| iOS simulator | `http://localhost:8000/api` |

## Run

```bash
npm start
```

Then press `a` (Android) or `i` (iOS), or scan the QR code with **Expo Go** on your phone (same Wi‑Fi as the PC).

## App structure

```
mobile/
  app/                 # Expo Router screens
    (auth)/            # Login, Register
    (tabs)/            # Menu, Cart, Orders, Profile (+ admin tabs)
  src/
    api/               # Axios + JWT refresh + SecureStore
    context/           # Auth + Cart state
    components/
```

## API used (same as web)

- `POST /api/user/login/`
- `POST /api/user/register/`
- `GET/PUT /api/user/profile/`
- `GET /api/products/`
- `POST /api/coupons/validate/`
- `GET/POST /api/orders/`
- `GET /api/queue/` (admin)
- `POST /api/queue/next/` (admin)

Tokens are stored in **expo-secure-store** (not plain AsyncStorage).

## Notes

- Register on mobile → activate via email link (same as web) before login.
- Product/coupon **management** is easiest on web; mobile reflects changes within ~15s (menu poll).
- For production, deploy Django with HTTPS and set `EXPO_PUBLIC_API_URL` to your server URL.
