# Kbee Computers - Frontend

A professional e-commerce website for Kbee Computers, selling UK used and new laptops, laptop chargers, WiFi routers, and external drives.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Authentication (Google Sign-in)
- **State Management**: Zustand
- **API Client**: Axios
- **Icons**: Lucide React
- **Carousel**: Swiper.js
- **Image Optimization**: Next.js Image component with Pexels stock photos

## Features

### Complete E-commerce Functionality
- Auto-sliding hero carousel showcasing featured products
- Product catalog with grid/list view toggle
- Advanced filtering and sorting
- Shopping cart with quantity management
- Wishlist functionality
- Real-time cart and wishlist badge counts
- Responsive design (mobile-first)

### Pages Included
1. **Homepage** - Hero carousel, categories, new arrivals, best sellers, testimonials
2. **Shop** - Product listing with filters and sorting
3. **Product Detail** - Full product information (to be connected to backend)
4. **Cart** - Shopping cart management
5. **Wishlist** - Saved products
6. **Checkout** - Order processing (to be connected to backend)
7. **Sign In** - Firebase Google authentication
8. **Profile** - User account management (to be connected to backend)

### Navigation
- Sticky navbar with search, wishlist, cart, and user profile
- Category dropdown
- Three-step sidebar navigation
- Cart sidebar (slides from right)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project set up

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google authentication in Authentication > Sign-in method
4. Get your Firebase config from Project Settings
5. Add the config values to your `.env.local` file

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage
│   ├── layout.tsx         # Root layout with navbar/footer
│   ├── shop/              # Shop page
│   ├── cart/              # Shopping cart
│   ├── wishlist/          # Wishlist
│   └── signin/            # Authentication
├── components/            # React components
│   ├── Navbar.tsx         # Main navigation
│   ├── Footer.tsx         # Site footer
│   ├── Sidebar.tsx        # Mobile menu
│   ├── CartSidebar.tsx    # Cart sidebar
│   ├── HeroCarousel.tsx   # Hero carousel
│   └── ProductCard.tsx    # Product card
├── store/                 # Zustand state management
│   ├── authStore.ts       # Authentication state
│   ├── cartStore.ts       # Shopping cart state
│   └── wishlistStore.ts   # Wishlist state
├── lib/                   # Utilities
│   ├── firebase.ts        # Firebase configuration
│   ├── axios.ts           # API client setup
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Helper functions
└── public/               # Static assets
```

## Features Implementation Status

✅ Homepage with all sections
✅ Navbar with search, cart, wishlist
✅ Hero carousel (auto-sliding)
✅ Product cards with hover effects
✅ Shopping cart (add, remove, update quantity)
✅ Wishlist (add, remove, clear)
✅ Firebase Google authentication
✅ Shop page with grid/list view
✅ Responsive design
✅ Loading states and error handling
⏳ Product detail page (needs backend connection)
⏳ Checkout process (needs backend connection)
⏳ Order history (needs backend connection)
⏳ Profile page (needs backend connection)

## Design Features

- **Color Scheme**: Gold (#FFD700) as primary accent with black, gray, and white
- **Professional Design**: Clean, modern, production-ready interface
- **Smooth Animations**: Transitions and hover effects on all interactive elements
- **Responsive Breakpoints**: Mobile, tablet, and desktop optimized
- **High-Quality Images**: Pexels stock photos for realistic product presentation

## API Integration

The frontend is ready to connect to the Django backend API. Update the `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend server.

Expected API endpoints:
- `GET /api/products/` - List products
- `GET /api/products/{slug}/` - Product detail
- `GET /api/categories/` - List categories
- `POST /api/cart/add/` - Add to cart
- `GET /api/cart/` - Get cart items
- `POST /api/wishlist/add/` - Add to wishlist
- `POST /api/orders/create/` - Create order

## Build for Production

```bash
npm run build
npm run start
```

## License

© 2025 Kbee Computers. All rights reserved.
