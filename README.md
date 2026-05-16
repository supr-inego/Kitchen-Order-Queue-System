# 🍽️ Crammer's Restaurant — Kitchen Order Queue System

A full-stack restaurant ordering platform designed for seamless ordering and kitchen management across web and mobile devices.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Mobile Integration](#mobile-integration)
- [Configuration](#configuration)

---

## ✨ Features

### For Customers
- 🛒 **Browse & Order** — Menu with product images and details
- 🎟️ **Smart Discounts** — Apply coupon codes with instant validation
- 📱 **Live Tracking** — Real-time order status with progress bar
- 🔔 **Pickup Alerts** — Notifications when order is ready
- 🔐 **Cross-Platform** — Same account works on web and mobile

### For Admin
- 📦 **Product Management** — Add/edit/delete menu items with images
- 🖼️ **Easy Image Upload** — Paste any direct image URL
- 📊 **Order Dashboard** — View, filter, and update all orders
- 🎫 **Kitchen Queue** — Live ticket board with auto-refresh (15s)
- 🏷️ **Coupon Builder** — Create flexible discount codes:
  - Percentage off (e.g., 20% off)
  - Fixed amount off (e.g., ₱50 off)
  - Free cheapest item
  - Set minimums, expiry dates, and usage limits

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Django 6 + Django REST Framework + SimpleJWT |
| **Frontend** | React 19 + Vite + Tailwind CSS 4 |
| **Mobile** | React Native / Expo |
| **Authentication** | JWT (access + refresh tokens, email activation) |
| **Development** | CORS enabled, hot reload, mobile-ready |

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate              # On Windows: venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser       # Create admin account
python manage.py runserver 0.0.0.0:8000
```

**Note:** `0.0.0.0:8000` allows mobile devices to connect from your local network.

### Frontend (Web) Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Mobile (Expo) Setup

```bash
cd mobile
npm install
cp .env.example .env

# Set EXPO_PUBLIC_API_URL to your machine's local IP (see below)
npm start
```

See [mobile/README.md](mobile/README.md) for emulator configuration and device setup instructions.

---

## 📱 Mobile Integration

### Finding Your Local IP

The mobile app needs your computer's local IP address to connect to the backend.

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# Look for 192.168.x.x
```

**Windows:**
```bash
ipconfig
# Find "IPv4 Address"
```

### Environment Configuration

Update `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000/api
# Replace X with the last octet of your IP
```

### Authentication Flow

Store JWT tokens securely on the device:

```javascript
import * as SecureStore from 'expo-secure-store';

// After login
await SecureStore.setItemAsync('access_token', response.access);
await SecureStore.setItemAsync('refresh_token', response.refresh);
await SecureStore.setItemAsync('user', JSON.stringify(response.user));

// Add to request headers
headers: { 
  Authorization: `Bearer ${accessToken}` 
}
```

### Real-Time Updates

Example polling implementation for order tracking:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${BASE_URL}/orders/`, { headers });
    const data = await res.json();
    setOrders(data);
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

### Cross-Platform Accounts

- Same email/password works on web and mobile
- JWT tokens are interchangeable
- Orders, products, and coupons sync automatically
- Customer sees identical experience on all platforms

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/user/register/` | Register new customer account |
| `POST` | `/api/user/login/` | Login and receive JWT tokens |
| `POST` | `/api/user/logout/` | Logout and blacklist refresh token |
| `GET/PUT` | `/api/user/profile/` | Get or update profile information |

### Products & Ordering

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/products/` | List all available menu items (public) |
| `GET/POST` | `/api/orders/` | View my orders / place new order |
| `GET` | `/api/orders/{id}/` | Get order details with queue ticket |

### Queue & Promotions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/queue/` | Get current kitchen queue |
| `POST` | `/api/coupons/validate/` | Validate coupon code before checkout |

---

## ⚙️ Configuration

### Backend Settings

The backend is pre-configured for development with:
- `ALLOWED_HOSTS = ["*"]` — Accepts requests from any host
- `CORS_ALLOW_ALL_ORIGINS = True` — Allows cross-origin requests

For **production**, update these settings in `backend/settings.py`:
```python
ALLOWED_HOSTS = ["yourdomain.com", "www.yourdomain.com"]
CORS_ALLOWED_ORIGINS = ["https://yourdomain.com"]
```

---

## 🎟️ Sample Coupons to Create

Get started by creating these example promotional codes in the admin panel:

| Code | Type | Value | Min Order | Usage |
|------|------|-------|-----------|-------|
| `WELCOME10` | Percentage | 10% | ₱0 | First-time customer incentive |
| `SAVE50` | Fixed | ₱50 off | ₱200 | Bulk order discount |
| `FREEITEM` | Free Item | Cheapest | ₱150 | Loyalty reward |
| `LUNCH20` | Percentage | 20% | ₱100 | Off-peak hours promotion |

---

## 👨‍💼 Admin Account Setup

### Via Django Management Command

```bash
python manage.py createsuperuser
# Follow prompts to create account
# Then go to /admin/ and set the user's role to "admin"
```

### Via Django Shell

```bash
python manage.py shell
>>> from user.models import User
>>> u = User.objects.get(email="your@email.com")
>>> u.role = "admin"
>>> u.is_active = True
>>> u.save()
```

---

## 📝 License

This project is developed for Crammer's Restaurant.

---

## 🤝 Support

For setup issues, check the individual README files:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Mobile README](mobile/README.md)
