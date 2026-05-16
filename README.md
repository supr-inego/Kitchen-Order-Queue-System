# Crammer's Restaurant — Kitchen Order Queue System 

A full-stack restaurant ordering system with:
- **Product images** (via URL — paste any Google Image address)
- **Discount coupons** (%, fixed ₱, or free cheapest item)
- **No admin self-registration** — all registrations are customers only
- **Mobile-ready API** — same backend works for React Native / Expo apps

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Django 6 + DRF + SimpleJWT |
| Frontend (Web) | React 19 + Vite + Tailwind CSS 4 |
| Mobile | React Native / Expo (connect to same backend) |
| Auth | JWT — access + refresh tokens, email activation |

---

## Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # creates an admin account
python manage.py runserver 0.0.0.0:8000   # 0.0.0.0 lets mobile devices connect
```

### Frontend (Web)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Mobile (Expo)

```bash
cd mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your PC's LAN IP
npm start
```

See [mobile/README.md](mobile/README.md) for emulator URLs and device setup. The mobile app uses the **same JWT login, database, products, orders, and coupons** as web.

---

## Features

### Admin
- **Products** — Add/edit/delete menu items with name, description, category, price, availability, and image URL
- **Image URL** — Paste any direct image URL (right-click a Google image → "Open image in new tab" → copy URL from address bar)
- **Orders** — View all customer orders, filter by status, expand for item details, update status
- **Kitchen Queue** — Live ticket board, "Call Next" button, auto-refreshes every 15s
- **Coupons** — Create discount codes:
  - `%` off (e.g. 20% off entire order)
  - Fixed `₱` off (e.g. ₱50 off)
  - Free cheapest item in cart
  - Set minimum order total, expiry dates, and max uses

### Customer
- Browse menu with photos
- Add to cart with quantity control
- Apply coupon code at checkout (validates instantly)
- Live order tracking (5s polling) with status progress bar
- "Ready for pickup" popup notification

---

## Mobile Integration Guide

The backend is fully API-driven and ready for a React Native / Expo app to connect.

### Base URL for mobile

Point your mobile app's axios instance to your computer's **local IP** on port 8000:

```js
// In your React Native / Expo app
const BASE_URL = "http://192.168.1.X:8000/api";   // replace X with your machine's IP
```

Find your IP:
- **Mac/Linux**: `ifconfig | grep "inet "` → look for 192.168.x.x
- **Windows**: `ipconfig` → IPv4 Address

The backend is already configured with `ALLOWED_HOSTS = ["*"]` and `CORS_ALLOW_ALL_ORIGINS = True` for development.

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/register/` | Register new customer |
| POST | `/api/user/login/` | Login, get JWT tokens |
| POST | `/api/user/logout/` | Logout (blacklist refresh) |
| GET/PUT | `/api/user/profile/` | Get/update profile |
| GET | `/api/products/` | List menu items (public) |
| GET/POST | `/api/orders/` | Customer: my orders / place order |
| GET | `/api/orders/{id}/` | Get single order (with queue ticket) |
| GET | `/api/queue/` | Get queue list |
| POST | `/api/coupons/validate/` | Validate coupon before ordering |

### Authentication on mobile

```js
// Store tokens in SecureStore (Expo) or AsyncStorage
import * as SecureStore from 'expo-secure-store';

// After login:
await SecureStore.setItemAsync('access_token', data.access);
await SecureStore.setItemAsync('refresh_token', data.refresh);
await SecureStore.setItemAsync('user', JSON.stringify(data.user));

// Add to every request header:
headers: { Authorization: `Bearer ${accessToken}` }
```

### Accounts work on both web and mobile

The same email/password and JWT tokens work across both platforms — a customer who logs in on mobile will see the same orders as on web, and vice versa.

### Real-time updates on mobile

Use polling (setInterval) or a WebSocket library. Example polling in React Native:

```js
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${BASE_URL}/orders/`, { headers });
    const data = await res.json();
    setOrders(data);
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

---

## Coupon Examples to Create

| Code | Type | Value | Min Order | Description |
|---|---|---|---|---|
| `WELCOME10` | % | 10 | ₱0 | 10% off first order |
| `SAVE50` | fixed | 50 | ₱200 | ₱50 off orders ₱200+ |
| `FREEITEM` | free_item | — | ₱150 | Get cheapest item free |
| `LUNCH20` | % | 20 | ₱100 | 20% lunch discount |

---

## Admin Account

Create via Django management command:
```bash
python manage.py createsuperuser
# Then in Django admin (/admin/) set the user's role to "admin"
```

Or update via shell:
```bash
python manage.py shell
>>> from user.models import User
>>> u = User.objects.get(email="your@email.com")
>>> u.role = "admin"; u.is_active = True; u.save()
```

