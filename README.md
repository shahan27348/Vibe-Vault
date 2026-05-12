# Vibe Vault

A full-stack AI-powered fashion e-commerce store built with Next.js 16. Features include a product catalog, shopping cart, Stripe checkout, Clerk authentication, AI virtual try-on (Google Gemini), voice shopping assistant, and a full admin dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB (Mongoose) |
| Authentication | Clerk |
| Payments | Stripe |
| AI / Try-On | Google Gemini API |
| Voice Assistant | Google Gemini Live API |
| State Management | Zustand |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/               # Next.js App Router pages & API routes
│   ├── admin/         # Admin dashboard (products, orders, reviews, slider, voice)
│   ├── api/           # REST API routes
│   ├── checkout/      # Stripe checkout page
│   ├── orders/        # Order history
│   ├── shop/          # Product listing & detail pages
│   ├── try-on/        # AI virtual try-on page
│   └── wishlist/      # Wishlist page
├── components/        # Reusable React components
├── lib/               # Utilities, DB connection, store, voice client
└── models/            # Mongoose models (Product, Order, Cart, Review, User)
```

---

## Prerequisites

Make sure you have the following installed before running the project:

- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- A **MongoDB** database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Environment Variables Setup

Project root mein `.env.local` file banao aur neeche diye gaye variables fill karo:

```bash
# ── Database ──────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/vibe-vault

# ── Clerk Authentication ───────────────────────────────────
# https://dashboard.clerk.com se keys lein
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx

# ── Stripe Payments ────────────────────────────────────────
# https://dashboard.stripe.com/apikeys se keys lein
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx

# ── Google Gemini AI (Try-On + Voice Assistant) ─────────────
# https://aistudio.google.com/app/apikey se key lein
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxx

# ── Admin Access ───────────────────────────────────────────
# Admin banane ke liye apni email(s) comma-separated likh dein
ADMIN_EMAILS=admin@example.com,another@example.com

# ── App URL (optional, for metadata) ──────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

> **Note:** `.env.local` file `.gitignore` mein already hoti hai — isko kabhi commit mat karo.

---

## Installation & Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/shahan27348/Vibe-Vault.git
cd vibe-vault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

`.env.local` file banao (upar wali table dekho) aur apni keys fill karo.

### 4. Seed the database (optional)

Database mein sample products load karne ke liye:

```bash
npx ts-node seed.ts
```

### 5. Start the development server

```bash
npm run dev
```

App **http://localhost:3001** par khul jaayegi.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server start karo (port 3001) |
| `npm run build` | Production build banao |
| `npm start` | Production server start karo (port 3001) |
| `npm run lint` | ESLint se code check karo |

---

## Protected Routes

Neeche diye routes Clerk authentication require karte hain:

| Route | Access |
|---|---|
| `/admin/*` | Sirf admin emails (ADMIN_EMAILS) |
| `/checkout` | Login required |
| `/orders` | Login required |

---

## Deployment on Vercel

1. [Vercel](https://vercel.com) par account banao
2. GitHub repo connect karo
3. **Environment Variables** section mein upar wali saari keys add karo
4. Deploy karo — Vercel automatically `npm run build` run karega

> `vercel.json` already configured hai with correct build settings aur API function timeouts.

---

## Key Features

- **Product Catalog** — Eastern & Western wear with filters, search, and categories
- **Shopping Cart** — Persistent cart with Zustand state management
- **Stripe Checkout** — Secure online payments
- **Clerk Auth** — Sign in / Sign up with social login support
- **AI Virtual Try-On** — Google Gemini se product images pe virtual try-on
- **Voice Assistant** — Gemini Live API se voice-based product search & shopping
- **Admin Dashboard** — Products, orders, reviews, slider, and voice settings management
- **Wishlist** — Save products for later
- **Responsive Design** — Mobile-first Tailwind CSS layout
