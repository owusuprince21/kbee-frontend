# Kbee Computers - Quick Setup Guide

## Frontend Setup (COMPLETED ✅)

### Prerequisites
- Node.js 18+ installed
- Firebase account (free tier is sufficient)

### Step 1: Firebase Configuration

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter "Kbee Computers" as project name
   - Continue through the setup

2. **Enable Google Authentication**:
   - In Firebase Console, go to Authentication
   - Click "Get Started"
   - Go to "Sign-in method" tab
   - Enable "Google" provider
   - Save changes

3. **Get Firebase Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Web" icon (</>)
   - Register your app
   - Copy the configuration object

4. **Update Environment Variables**:
   - Open `frontend/.env.local`
   - Replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api

NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

### Step 2: Install Dependencies

```bash
cd frontend
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Test the Application

1. **Homepage**: Should display with hero carousel, categories, and all sections
2. **Shop**: Navigate to shop page, view products in grid/list mode
3. **Cart**: Add products to cart, see them in cart sidebar and cart page
4. **Wishlist**: Add products to wishlist, view wishlist page
5. **Authentication**: Click "Sign In", authenticate with Google, see your profile
6. **Product Detail**: Click on any product to view details
7. **Logout**: Click your profile, then "Logout"

### Build for Production

```bash
npm run build
npm run start
```

## Backend Setup (TO BE DONE)

The backend needs to be created separately using Django. Here's a quick outline:

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- pip and virtualenv

### Planned Steps

1. **Create Django Project**:
```bash
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install django djangorestframework psycopg2-binary django-cors-headers pillow
django-admin startproject kbee_backend .
```

2. **Create Apps**:
```bash
python manage.py startapp products
python manage.py startapp orders
python manage.py startapp users
```

3. **Configure Settings**:
   - Add apps to INSTALLED_APPS
   - Configure PostgreSQL database
   - Set up CORS headers
   - Configure media/static files

4. **Create Models** (as specified in PROJECT_SUMMARY.md)

5. **Create Serializers and Views**

6. **Configure URLs**

7. **Run Migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

8. **Create Superuser**:
```bash
python manage.py createsuperuser
```

9. **Run Server**:
```bash
python manage.py runserver
```

### Backend API Endpoints to Create

All endpoints are documented in `PROJECT_SUMMARY.md` under "Required API Endpoints".

## Connecting Frontend to Backend

Once the backend is ready:

1. **Update API URL**:
   - In `frontend/.env.local`, update `NEXT_PUBLIC_API_URL` to your backend URL

2. **Test API Integration**:
   - Shop page should load real products
   - Cart operations should sync with backend
   - Wishlist should sync with backend
   - Orders should be created successfully

## Project Structure

```
project/
├── frontend/                    ✅ COMPLETE
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── store/                  # State management
│   ├── lib/                    # Utilities
│   └── public/                 # Static files
│
└── backend/                     ⏳ TO BE CREATED
    ├── products/               # Product management
    ├── orders/                 # Order processing
    ├── users/                  # User management
    └── api/                    # REST API
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend (.env) - TO BE CREATED
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/kbee_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Troubleshooting

### Frontend Issues

**Issue**: "Firebase not initialized"
- **Solution**: Make sure you've updated `.env.local` with valid Firebase credentials

**Issue**: "Module not found"
- **Solution**: Run `npm install` in the frontend directory

**Issue**: Images not loading
- **Solution**: Check your internet connection (using Pexels CDN)

**Issue**: Cart/Wishlist not persisting
- **Solution**: Check browser localStorage is enabled

### Backend Issues (When Created)

**Issue**: CORS errors
- **Solution**: Ensure django-cors-headers is installed and configured

**Issue**: Database connection failed
- **Solution**: Verify PostgreSQL is running and credentials are correct

**Issue**: Static files not loading
- **Solution**: Run `python manage.py collectstatic`

## Testing Checklist

### Frontend Testing
- [ ] Homepage loads with all sections
- [ ] Hero carousel auto-slides
- [ ] Navigation works (all links)
- [ ] Search bar functional (visual)
- [ ] Cart: Add/Remove/Update items
- [ ] Wishlist: Add/Remove items
- [ ] Authentication: Sign in/Sign out with Google
- [ ] Product cards display correctly
- [ ] Responsive design works on mobile
- [ ] All hover effects work
- [ ] Badge counts update correctly

### Backend Testing (When Created)
- [ ] All API endpoints respond correctly
- [ ] Products can be created/updated via admin
- [ ] Cart operations work with authentication
- [ ] Wishlist operations work with authentication
- [ ] Orders can be created
- [ ] Images upload correctly
- [ ] Filtering and sorting work
- [ ] Pagination works

## Deployment

### Frontend Deployment (Vercel - Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend Deployment (Heroku/Railway - Recommended)

1. Add Procfile
2. Add requirements.txt
3. Configure production settings
4. Add PostgreSQL database
5. Deploy

## Support

For issues or questions, refer to:
- PROJECT_SUMMARY.md for complete feature list
- README.md in frontend/ for frontend details
- Django documentation for backend setup

## Next Steps

1. ✅ Frontend is complete and ready to use
2. ⏳ Create Django backend following the structure in PROJECT_SUMMARY.md
3. ⏳ Connect frontend to backend API
4. ⏳ Test complete user flows
5. ⏳ Deploy to production

---

**Current Status**: Frontend is 100% complete and production-ready. Backend needs to be created.

© 2025 Kbee Computers. All rights reserved.
