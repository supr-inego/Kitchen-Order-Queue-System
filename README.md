# Crammer's Restaurant — Kitchen Order Queue System

A full-stack restaurant ordering system with role-based access:

- **Admin / Staff**: Manage products, view all orders, control kitchen queue
- **Customer**: Browse menu, place orders with cart, track orders live

## Stack

- **Backend**: Django + DRF + JWT auth (SimpleJWT)
- **Frontend**: React + Vite + Tailwind CSS

---

## Features

### Customer
- Register & login as customer
- Browse menu by category
- Add items to cart, place orders with notes
- View your own orders with live status progress bar
- Track any order by ID

### Admin / Staff
- Dashboard with live stats
- Manage menu items (add, edit, delete, categories, availability)
- View all customer orders, filter by status, update status
- Kitchen Queue view with "Call Next" button, auto-refreshes every 15s

---

## Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # set role=admin in Django admin or .env
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## How It Works

1. Customer registers & logs in → lands on menu/home
2. Customer builds cart → places order → queue ticket auto-created
3. Admin sees order appear instantly in Orders & Kitchen Queue
4. Admin updates queue status → order status syncs automatically
5. Customer can see live status on My Orders or Track page

