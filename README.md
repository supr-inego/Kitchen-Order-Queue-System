# 🍽️ Crammer's Restaurant - Kitchen Order Queue System

A full-stack restaurant ordering and kitchen management system with role-based access control, real-time order tracking, and a kitchen queue workflow.

---

## 👥 Collaborators

| Name |
|------|
| Cyril Inego Dayak |
| Kyle Angela F. Jumilla |
| Meri Cairylle Ara Comique |
| Merryl Gabrielle Louise Ignacio |
| Dominic O. Gabac |
| Jastine V. Agana |
| Gabriel D. LLacuna |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 6.0.3 + Django REST Framework 3.15.2 |
| **Authentication** | SimpleJWT (access + refresh tokens, blacklist on logout) |
| **Frontend** | React 19 + Vite 7 + Tailwind CSS 4 |
| **HTTP Client** | Axios (with automatic token refresh interceptors) |
| **Database** | SQLite (development) — PostgreSQL-ready |
| **Email** | Django email backend (console or SMTP via `.env`) |
| **CORS** | django-cors-headers |

---

## ✨ Features

### 👤 Customer
- Register with email verification (activation link sent to inbox)
- Log in / log out securely
- Browse the full menu, filtered by category
- Build a cart and place orders with optional notes
- View personal order history with a live status progress bar
- Track any order by ID on the Track page

### 🛠️ Admin / Staff
- **Dashboard** — live stats overview
- **Products** — add, edit, delete menu items; set category and availability
- **Orders** — view all customer orders, filter by status, update order status
- **Kitchen Queue** — "Call Next" button advances the next waiting ticket to cooking; auto-refreshes every 15 seconds

---

## 🗂️ Project Structure

```
restaurant-system/
├── backend/
│   ├── api/                  # Products, Orders, Queue (models, views, serializers, URLs)
│   ├── user/                 # Custom User model, auth views, email activation
│   ├── config/               # Django settings, root URL conf, WSGI/ASGI
│   ├── templates/emails/     # HTML email templates (activation)
│   ├── requirements.txt
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── api/api.js         # Axios instance + auth interceptors
    │   ├── components/        # Navbar, EditModal
    │   ├── pages/
    │   │   ├── admin/         # AdminDashboard, AdminProducts, AdminOrders, AdminQueue
    │   │   └── customer/      # CustomerHome, CustomerOrder, CustomerMyOrders, CustomerTrack
    │   ├── App.jsx            # AuthContext, ProtectedRoute, routing
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone the Repository

```bash
git clone <[your-repo-url](https://github.com/supr-inego/Kitchen-Order-Queue-System)>
cd restaurant-system
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Create a superuser (admin account)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

Backend runs at **http://localhost:8000**
Django admin panel at **http://localhost:8000/admin**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. Environment Variables (Optional)

Create a `.env` file inside `backend/` to configure email and secrets:

```env
DJANGO_SECRET_KEY=your-secret-key-here

# Email (leave blank to use console backend during dev)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your@email.com

# Frontend URL used to build activation links in emails
FRONTEND_URL=http://localhost:5173
```

---

## 🔐 Authentication Flow

1. **Register** — User submits registration form → account created with `is_active=False` → activation email sent with a unique link.
2. **Activate** — User clicks the link (`/activate/<uid>/<token>`) → account activated.
3. **Login** — Returns JWT access token (1-hour lifetime) and refresh token (7-day lifetime).
4. **Auto-refresh** — Axios interceptor silently refreshes the access token on 401 responses.
5. **Logout** — Refresh token is blacklisted server-side; tokens cleared from localStorage.

### Role-Based Access

| Role | Accessible Routes |
|------|------------------|
| `admin` | `/admin`, `/admin/products`, `/admin/orders`, `/admin/queue` |
| `customer` | `/home`, `/order`, `/my-orders`, `/track` |

Routes are protected by `ProtectedRoute` in `App.jsx`, which redirects users to the appropriate home based on their role.

---

## 🔌 API Reference

### Auth Endpoints (`/api/user/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register/` | Public | Register a new user |
| `GET` | `/activate/<uid>/<token>/` | Public | Activate account via email link |
| `POST` | `/login/` | Public | Log in, receive JWT tokens |
| `POST` | `/logout/` | Required | Blacklist refresh token |
| `POST` | `/token/refresh/` | Public | Get new access token from refresh token |
| `GET` | `/profile/` | Required | Get current user's profile |
| `PUT` | `/profile/` | Required | Update current user's profile (partial update supported) |

### Product Endpoints (`/api/products/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products/` | Public | List all menu items |
| `GET` | `/api/products/<id>/` | Public | Get a single product |
| `POST` | `/api/products/` | Admin | Create a new product |
| `PUT/PATCH` | `/api/products/<id>/` | Admin | Update a product |
| `DELETE` | `/api/products/<id>/` | Admin | Delete a product |

### Order Endpoints (`/api/orders/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/orders/` | Required | List orders (customers see only their own) |
| `POST` | `/api/orders/` | Required | Place a new order (queue ticket auto-created) |
| `GET` | `/api/orders/<id>/` | Required | Get order details |
| `PUT/PATCH` | `/api/orders/<id>/` | Required | Update order (status change) |
| `DELETE` | `/api/orders/<id>/` | Admin | Delete an order |

### Queue Endpoints (`/api/queue/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/queue/` | Required | List all queue tickets |
| `GET` | `/api/queue/<id>/` | Required | Get a queue ticket |
| `PUT/PATCH` | `/api/queue/<id>/` | Admin | Update queue status (syncs order status) |
| `POST` | `/api/queue/next/` | Admin | Advance the next waiting ticket to "cooking" |

> Queue tickets cannot be created manually — they are auto-generated when an order is placed.

---

## 📊 Data Models

### Order Status Flow

```
pending → preparing → ready → completed → cancelled
```

### Queue Status Flow (mirrors order status)

```
waiting → cooking → serving → done
```

When the admin updates a queue ticket's status, the linked order's status is automatically synced:

| Queue Status | Order Status |
|-------------|-------------|
| waiting | pending |
| cooking | preparing |
| serving | ready |
| done | completed |

---

## 🚀 How It Works (End-to-End)

1. Customer registers, activates their account via email, and logs in.
2. Customer browses the menu on the Home page, adds items to the cart.
3. Customer submits the order — a Queue ticket is automatically created.
4. Admin sees the new order appear in Orders and the Kitchen Queue instantly.
5. Admin clicks **"Call Next"** to pull the next waiting ticket into the cooking queue.
6. As the admin advances the queue status, the customer's order status updates live.
7. Customer can monitor progress on **My Orders** or the **Track** page.

---

## 🛠️ Troubleshooting

**Login fails immediately after registration**
The account must be activated first. Check your email inbox for the activation link. During development (console email backend), the link is printed in the Django terminal.

**Tokens stop working**
Access tokens expire after 1 hour. The frontend refreshes them automatically. If both tokens are expired, the user is redirected to `/login`.

**Backend returns 500**
Run `python manage.py migrate` to ensure all migrations are applied, and check the Django terminal for stack traces.

**CORS errors in the browser**
Confirm the frontend dev server URL (e.g. `http://localhost:5173`) is listed in `CORS_ALLOWED_ORIGINS` inside `backend/config/settings.py`.

**Activation email not received**
In development, `EMAIL_BACKEND` defaults to the console backend — look for the activation URL printed in the Django terminal, not your inbox. Set SMTP credentials in `.env` to send real emails.

---

## 📦 Dependencies

### Backend (`requirements.txt`)
- `Django 6.0.3`
- `djangorestframework 3.15.2`
- `djangorestframework-simplejwt 5.3.1`
- `django-cors-headers 4.4.0`
- `python-dotenv 1.0.1`

### Frontend (`package.json`)
- `react 19`, `react-dom 19`, `react-router-dom 7`
- `axios 1.x`
- `tailwindcss 4`, `@tailwindcss/vite`
- `vite 7`, `@vitejs/plugin-react`
