# 📰 Online Newspaper Delivery Management System

A full-stack SaaS application for digital newspaper subscriptions and downloads. Users can sign up, choose a subscription plan (Weekly/Monthly), and download the latest editions of various English and Tamil newspapers.

## 🚀 Live Demo
**Frontend:** [https://online-news-frontend.vercel.app/](https://online-news-frontend.vercel.app/)  
**Backend:** [https://online-news-backend.onrender.com](https://online-news-backend.onrender.com)

---

## ✨ Features
- **User Authentication**: Secure Sign Up and Sign In system using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Subscription Management**: 
  - Integrated demo subscription activation (Weekly and Monthly plans).
  - Stripe-ready payment flow logic.
  - Subscription locking: Prevents switching plans without canceling the active one.
  - Expiry detection: Automatically blocks downloads when a subscription ends.
- **Newspaper Catalog**: Filterable grid of newspapers by language (English/Tamil).
- **Secure Downloads**: Backend-protected PDF serving. Only authenticated users with active, non-expired subscriptions can download papers.
- **Admin Dashboard**:
  - View all registered users and their current subscription status.
  - Manually activate/deactivate user subscriptions.
  - Revenue tracking and dashboard metrics.
- **Responsive UI**: Modern, professional design with a custom side-drawer for mobile access and smooth micro-animations.

---

## 🛠️ Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern Flexbox/Grid), JavaScript (ES6 Modules).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Cloud).
- **Authentication**: JWT, bcryptjs.
- **Email**: NodeMailer (Gmail SMTP).
- **Deployment**:
  - **Vercel**: Static Frontend hosting.
  - **Render**: Backend Web Service.
  - **MongoDB Atlas**: Managed Database.

---

## 💻 Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Basha2120/Online-News.git
   cd Online-News
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_random_secret_key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_admin_password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Run the server**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure
```text
├── js/
│   ├── core/       # API and Auth utilities
│   ├── layout/     # Shared UI components (Header)
│   └── pages/      # Page-specific logic (Home, Profile, Admin)
├── server/
│   ├── downloads/  # Secure PDF storage
│   ├── db.js       # Database connection
│   └── index.js    # Express server & API routes
├── styles.css      # Central design system
├── index.html      # Home Page
├── profile.html    # User Profile
├── subscription.html# Pricing & Subscription control
└── admin.html      # Admin Panel
```

---

## 🛡️ License
Distributed under the ISC License.

## 👥 Authors
- **Basha Bhai** - *Initial Work*
