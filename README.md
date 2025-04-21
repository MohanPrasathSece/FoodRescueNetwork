# Food Rescue Network

A web-based platform connecting food donors with volunteers to reduce food waste and help those in need.

## Features

### Donor Interface
- Post food donations with details (type, quantity, expiry)
- Track donation status
- Manage donation history

### Volunteer Interface
- View available food donations
- Claim and schedule pickups
- Track completed rescues

### Admin Dashboard
- Monitor all donations and pickups
- Manage user accounts
- View platform statistics

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase (Authentication, Firestore, Hosting)

## Setup

1. Clone the repository
2. Configure Firebase credentials in `public/js/firebase-config.js`
3. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

# Food Rescue Network - MERN Stack Application

A full-stack web application connecting food donors with volunteers to reduce food waste and help communities in need.

## Features

- User authentication with role-based access (Donors, Volunteers, Admins)
- Real-time donation listing and management
- Volunteer pickup scheduling and tracking
- Interactive dashboards for all user types
- Secure API endpoints with JWT authentication
- Modern, responsive UI built with Chakra UI

## Tech Stack

- **Frontend**: React.js, Chakra UI, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT, bcrypt

## Project Structure

```
food-rescue-network/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main application component
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── index.js         # Server entry point
└── package.json         # Project configuration
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create `.env` file in the server directory
   - Add necessary environment variables (MongoDB URI, JWT secret, etc.)

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Donations
- POST /api/donations - Create new donation
- GET /api/donations/available - List available donations
- POST /api/donations/:id/claim - Claim donation
- POST /api/donations/:id/complete - Complete pickup

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License