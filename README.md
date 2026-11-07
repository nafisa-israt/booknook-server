# BookNook – Backend API

The backend server for **BookNook**, an online book management and borrowing platform. It provides REST APIs using Node.js, Express.js, and MongoDB.

## Technologies
- Node.js and Express.js
- MongoDB
- Better Auth JWT and JOSE
- CORS

## Features
- Public book listing and book details.
- Authenticated create, update, and delete operations (book owner only).
- Borrow and return operations.
- Per-user borrowing history.
- Available-copy tracking and duplicate active-borrow checks.
- JWT verification using Better Auth's JWKS endpoint.

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/books` | Public | Get all books |
| GET | `/books/:id` | Public | Get one book |
| POST | `/books` | JWT | Add a book |
| PATCH | `/books/:id` | JWT + owner | Update a book |
| DELETE | `/books/:id` | JWT + owner | Delete a book |
| POST | `/borrows` | JWT | Borrow a book |
| GET | `/borrows` | JWT | Get the current user's borrow records |
| DELETE | `/borrows/:id` | JWT + owner | Return a borrowed book |

## Environment Variables

Create a `.env` file in the server root:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=https://your-deployed-client-domain.vercel.app
BETTER_AUTH_URL=https://your-deployed-client-domain.vercel.app
BETTER_AUTH_JWKS_URL=https://your-deployed-client-domain.vercel.app/api/auth/jwks
```

Set `CLIENT_URL` to the exact frontend origin allowed by CORS. The Better Auth URL and JWKS URL must point to the same deployed Better Auth application. Keep credentials private.

## Local Setup

```bash
git clone https://github.com/nafisa-israt/booknook-server.git
cd booknook-server
npm install
npm run dev
```

## Deployment
Live API: https://booknook-server-bzvz.onrender.com  
Frontend: https://booknook-nafisa7.vercel.app/  
Frontend repository: https://github.com/nafisa-israt/booknook
