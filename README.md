# FindMyRoom

FindMyRoom is a comprehensive, modern platform for finding and managing room rentals, flatmates, and properties. It bridges the gap between owners and tenants by offering an AI-powered, seamless, and secure experience.

## ✨ Key Features

- **Smart Search & AI Recommendations**: Intelligent parsing of natural language to find the best rooms matching your exact criteria.
- **AI-Powered Listing Verification**: Automated checks for photo quality and potential fake/scam listings, ensuring trust.
- **Tenant & Owner Dashboards**: Dedicated interfaces for owners to manage listings and inquiries, and for tenants to manage applications and saved rooms.
- **Real-Time Notifications & Messaging**: Built-in real-time chat powered by Socket.io, plus system notifications for inquiries and updates.
- **Community Hub**: A social feed for roommates to post requirements and find compatible living partners based on lifestyle matches.
- **Secure Authentication**: JWT-based secure login for distinct "Owner" and "Tenant" roles.

## 💻 Tech Stack

### Frontend
- **React.js (Vite)**
- **Framer Motion** (for smooth micro-animations and UI interactions)
- **React Router DOM**
- **Lucide React** (icons)
- **Socket.io Client** (real-time chat)

### Backend
- **Node.js & Express.js**
- **MongoDB & Mongoose** (Database)
- **Google Gemini API** (AI features)
- **Socket.io** (WebSockets)
- **Bcrypt & JWT** (Security)

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/PrasannABubbY-06/FindmyRoom.git
cd FindmyRoom
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/findmyroom
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend server:
```bash
node server.js
# or use nodemon for development
```

### 3. Setup Frontend
Open a new terminal in the project root:
```bash
npm install
```

Create a `.env.local` file in the root directory if you are using Firebase (optional):
```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ...other firebase config
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` and communicate with the backend on `http://localhost:5000`.

## 📸 Screenshots
*(Add screenshots of your application here)*

| Home Page | Owner Dashboard |
| --- | --- |
| ![Home Placeholder]() | ![Dashboard Placeholder]() |

## 🌐 Deployment

### Frontend (Vercel / Netlify)
1. Run `npm run build` to generate the production bundle in the `dist` folder.
2. Deploy the `dist` folder or connect your GitHub repository directly to Vercel/Netlify.
3. Make sure to configure environment variables on your hosting platform.

### Backend (Render / Heroku / DigitalOcean)
1. Set the build command to `npm install` and start command to `node server.js`.
2. Configure all environment variables (MongoDB URI, JWT Secret, Gemini Key) in the platform settings.

## 📄 License
This project is licensed under the MIT License.
