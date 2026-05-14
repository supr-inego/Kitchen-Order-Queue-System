# Authentication System - Implementation Guide

## Overview
A complete authorization and user profile system has been implemented for the Kitchen Order Queue System using Django REST Framework with JWT authentication on the backend and React on the frontend.

## Backend Setup (Django)

### 1. User App Created
- Created new Django app: `user`
- Location: `backend/user/`

### 2. User Model (`backend/user/models.py`)
The custom User model includes:
- **Email**: Login credential (unique, used instead of username)
- **Password**: Hashed password field
- **Personal Info**:
  - `first_name`: User's first name
  - `last_name`: User's last name
  - `phone`: Phone number
  - `address`: Home or business address
  - `age`: User's age
  - `birthday`: User's date of birth
- **Permissions**: 
  - `is_active`: Account status
  - `is_staff`: Staff privileges
  - `is_superuser`: Admin privileges
- **Timestamps**:
  - `date_joined`: Account creation date
  - `updated_at`: Last profile update time

### 3. Backend Endpoints

#### Authentication Endpoints:
```
POST /api/user/register/
  - Register new user
  - Input: email, password, password_confirm, first_name, last_name, phone, address, age, birthday
  - Returns: user data, access token, refresh token

POST /api/user/login/
  - User login
  - Input: email, password
  - Returns: user data, access token, refresh token

POST /api/user/logout/
  - Logout user (requires authentication)
  - Returns: success message

POST /api/user/token/refresh/
  - Refresh access token
  - Input: refresh_token
  - Returns: new access token
```

#### Profile Endpoints:
```
GET /api/user/profile/
  - Get current user's profile
  - Requires: Authorization header with access token
  - Returns: user data

PUT /api/user/profile/
  - Update user profile (all fields)
  - Requires: Authorization header with access token
  - Input: any profile fields to update
  - Returns: updated user data

PATCH /api/user/profile/
  - Partially update user profile
  - Requires: Authorization header with access token
  - Input: specific fields to update
  - Returns: updated user data
```

### 4. Authentication Mechanism
- **JWT Authentication**: Uses djangorestframework-simplejwt
- **Access Token**: Expires in 1 hour
- **Refresh Token**: Expires in 7 days
- **Token Rotation**: Automatic token rotation enabled

### 5. Django Admin Integration
The User model is registered in Django admin for management:
```bash
python manage.py createsuperuser  # Create admin account
# Access at: http://localhost:8000/admin/
```

### 6. Database Setup
- PostgreSQL database: `ordering_db`
- Migrations applied automatically
- User table created with all fields

## Frontend Setup (React)

### 1. API Service (`frontend/src/api/api.js`)
- **Axios interceptors** for:
  - Automatically attaching access token to requests
  - Handling token refresh on 401 responses
  - Redirecting to login on token expiration

### 2. Authentication Pages

#### Login Page (`frontend/src/pages/Login.jsx`)
- Clean login form with email and password fields
- Email validation
- Error handling
- Redirects to profile on successful login
- Link to registration page

#### Register Page (`frontend/src/pages/Register.jsx`)
- Comprehensive registration form
- Sections:
  - Account Information (email, password, password confirmation)
  - Personal Information (name, phone, address, age, birthday)
- Form validation
- Error handling
- Redirects to profile on successful registration

#### Profile Page (`frontend/src/pages/Profile.jsx`)
- View mode: Display all user information
- Edit mode: Update profile details
- Features:
  - View current profile
  - Edit personal information
  - Update all profile fields
  - One-click logout
  - Automatic redirect on unauthorized access

### 3. Navbar Updates (`frontend/src/components/Navbar.jsx`)
- Added "Profile" link (visible when logged in)
- Added "Logout" button
- Logout functionality clears tokens and redirects to login

### 4. Routing & Protection (`frontend/src/App.jsx`)
- **ProtectedRoute** component for auth-required pages
- Public routes:
  - `/login` - Login page
  - `/register` - Registration page
- Protected routes (require authentication):
  - `/profile` - User profile
  - `/customers` - Customers page
  - `/products` - Products page
  - `/orders` - Orders page
  - `/track-order` - Track order page
  - `/queues` - Queue page
- Automatic redirect to login if not authenticated

## Usage Instructions

### Backend - Starting the Server

1. **Activate Virtual Environment**:
   ```bash
   cd backend
   # On Windows:
   .\.venv\Scripts\activate
   ```

2. **Run Migrations** (if not already done):
   ```bash
   python manage.py migrate
   ```

3. **Create Superuser** (for Django admin):
   ```bash
   python manage.py createsuperuser
   ```

4. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```
   - Server runs on: `http://localhost:8000`
   - Admin panel: `http://localhost:8000/admin`

### Frontend - Starting the App

1. **Navigate to Frontend**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies** (if needed):
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - App runs on: `http://localhost:5173` (or shown in terminal)

### Testing the Authentication System

1. **Register a New User**:
   - Go to `/register`
   - Fill in all fields (at least email and password are required)
   - Click "Register"
   - You'll be automatically logged in and redirected to profile

2. **Login with Existing User**:
   - Go to `/login`
   - Enter email and password
   - Click "Login"
   - You'll be redirected to your profile

3. **View Profile**:
   - After login, click "Profile" in navbar
   - See all your personal information

4. **Edit Profile**:
   - On profile page, click "Edit Profile"
   - Update any fields
   - Click "Save Changes"
   - Changes are saved and profile reloads

5. **Logout**:
   - Click "Logout" button in navbar or profile page
   - Tokens are cleared
   - Redirected to login page

### Using Django Admin to Create Test Users

1. Go to `http://localhost:8000/admin`
2. Login with your superuser credentials
3. Click on "Users"
4. Click "Add User"
5. Enter email and password (twice)
6. Optionally fill in personal information
7. Save

Example test user:
- Email: `test@example.com`
- Password: `TestPassword123`
- First Name: `Test`
- Last Name: `User`

## API Usage Examples

### Register (cURL):
```bash
curl -X POST http://localhost:8000/api/user/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "password_confirm": "SecurePassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "age": 30,
    "birthday": "1993-01-15"
  }'
```

### Login (cURL):
```bash
curl -X POST http://localhost:8000/api/user/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

### Get Profile (cURL):
```bash
curl -X GET http://localhost:8000/api/user/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile (cURL):
```bash
curl -X PUT http://localhost:8000/api/user/profile/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "first_name": "Jane",
    "age": 31
  }'
```

## Security Features

1. **Password Hashing**: Passwords are hashed using Django's default algorithm
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Access tokens expire in 1 hour
4. **Token Refresh**: Automatic token refresh mechanism
5. **CORS Protection**: Backend configured for frontend at `http://localhost:5173`
6. **Authentication Required**: Protected routes require valid JWT token

## Settings Updated

- `INSTALLED_APPS`: Added `'user'` app
- `AUTH_USER_MODEL`: Set to `'user.User'` (custom user model)
- `REST_FRAMEWORK`: Configured JWT authentication
- `SIMPLE_JWT`: JWT token settings (expiration, rotation, etc.)

## Files Created/Modified

### Backend
- ✅ Created: `backend/user/` app
- ✅ Created: `backend/user/models.py` - User model
- ✅ Created: `backend/user/serializers.py` - DRF serializers
- ✅ Created: `backend/user/views.py` - API views
- ✅ Created: `backend/user/urls.py` - URL routing
- ✅ Created: `backend/user/admin.py` - Django admin config
- ✅ Updated: `backend/config/settings.py` - Settings
- ✅ Updated: `backend/config/urls.py` - Main URL config
- ✅ Created: `backend/user/migrations/` - Database migrations

### Frontend
- ✅ Created: `frontend/src/pages/Login.jsx` - Login component
- ✅ Created: `frontend/src/pages/Login.css` - Login styles
- ✅ Created: `frontend/src/pages/Register.jsx` - Registration component
- ✅ Created: `frontend/src/pages/Register.css` - Registration styles
- ✅ Created: `frontend/src/pages/Profile.jsx` - Profile component
- ✅ Created: `frontend/src/pages/Profile.css` - Profile styles
- ✅ Updated: `frontend/src/api/api.js` - API service with auth
- ✅ Updated: `frontend/src/components/Navbar.jsx` - Added profile/logout
- ✅ Updated: `frontend/src/App.jsx` - Added routes and protection

## Next Steps (Optional)

1. **Email Verification**: Add email verification on registration
2. **Password Reset**: Implement forgot password functionality
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Social Login**: Add Google/GitHub/Facebook login
5. **User Profile Picture**: Add avatar upload functionality
6. **Account Deletion**: Allow users to delete their accounts
7. **Activity Logging**: Log user activities for audit trail

## Troubleshooting

### Issue: "Login failed" error
- Check email and password are correct
- Ensure backend server is running
- Check CORS settings in `backend/config/settings.py`

### Issue: Token not working
- Tokens expire after 1 hour
- Use refresh token to get new access token
- Tokens are stored in localStorage

### Issue: Backend 500 error
- Check Django logs in terminal
- Verify database is running
- Run migrations: `python manage.py migrate`

### Issue: Profile not loading
- Check if user is authenticated (check localStorage)
- Verify access token is valid
- Check backend API response

## Support

For issues or questions, check the Django and React documentation or examine the implementation in the respective files.
