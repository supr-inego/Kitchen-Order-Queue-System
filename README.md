# 🍽️ Kitchen Order Queue System

A full-stack web application designed to manage food orders, organize kitchen workflow, and provide real-time order tracking. The system integrates customers, products, orders, and a queue display into a single connected process.

---

## 🧠 System Overview

This system allows staff to create and manage orders while the kitchen processes them through a structured queue. Customers can track their orders in real time using an order number.

---

## 🔄 System Flow

Customer → Order → Queue → Status Update → Tracking

1. A customer order is created.
2. The system automatically generates a queue ticket.
3. The order appears in the Queue screen.
4. Staff update the order status in the Orders page.
5. Queue and Track Order pages reflect updates in real time.

---

## 🎯 Purpose

* Organize kitchen operations using a queue-based workflow
* Ensure all orders are processed in order
* Provide real-time visibility of order status
* Maintain a fully connected and synchronized system

---

## ⚙️ Features

### 👤 Customer Management

* Add and manage customer information

### 🍔 Product Management

* Add and manage menu items and prices

### 🧾 Order Management

* Create orders with multiple items
* Automatically generates a queue ticket
* Controls order status:

  * pending
  * preparing
  * ready
  * completed

### 📋 Queue System (Read-Only)

* Displays active kitchen tickets
* Shows:

  * ticket number
  * customer name
  * status
* Updates automatically based on order status

### 📡 Order Tracking

* Track orders using order ID
* Displays real-time progress

---

## 🏗️ Tech Stack

### Backend

* Django
* Django REST Framework
* PostgreSQL

### Frontend

* React (Vite)
* Tailwind CSS
* Axios

---

## 📂 Project Structure

```
Kitchen-Order-Queue-System/
│
├── backend/        # Django backend (API)
├── frontend/       # React frontend
├── .gitignore
└── README.md
```

---

## 🚀 Installation Guide

### 1. Clone the Repository

```
git clone https://github.com/your-username/Kitchen-Order-Queue-System.git
cd Kitchen-Order-Queue-System
```

---

### 2. Backend Setup

```
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

### 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

## 🧪 Usage

1. Add customers and products
2. Create an order
3. View the order in the Queue page
4. Update order status in Orders page
5. Track the order in Track Order page

---

## 👨‍💻 Authors / Collaborators

* Cyril Inego Dayak
* Kyle Angela F. Jumilla
* Meri Cairylle Ara Comique
* Merryl Gabrielle Louise Ignacio
* Dominic O. Gabac
* Jastine V. Agana

---

## 📌 Notes

* Queue is **read-only** and reflects order status
* All updates are controlled through the Orders page
* Designed for educational and demonstration purposes

---

## 📄 License

This project is for academic use..
