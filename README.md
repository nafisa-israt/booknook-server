# BoiGhor - Server

The backend server for **BoiGhor**, a book management and borrowing application. It provides RESTful APIs to manage books and borrowing records using Node.js, Express.js, and MongoDB.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JSON Web Token (JWT)
- Better Auth
- JOSE

## Features

- RESTful API for managing books.
- Add, update, retrieve, and delete books.
- Retrieve individual book details.
- Borrow books and manage borrowing records.
- Return borrowed books.
- Prevent duplicate borrowing of the same book.
- Track total and available copies of books.
- Prevent borrowing when no copies are available.
- Protected API routes using JWT authentication.
- User-specific book and borrowing records.

## API Endpoints

### Books

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get a single book |
| POST | `/books` | Add a new book |
| PATCH | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

### Borrows

| Method | Endpoint | Description |
|---|---|---|
| POST | `/borrows` | Borrow a book |
| GET | `/borrows` | Get the logged-in user's borrowed books |
| DELETE | `/borrows/:id` | Return a borrowed book |

## Environment Variables

Create a `.env` file in the server root directory and configure the required environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Use your actual environment variable names and keep all credentials private.

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/nafisa-israt/booknook-server.git
```

2. Navigate to the project directory:

```bash
cd booknook-server
```

3. Install dependencies:

```bash
npm install
```

4. Configure the environment variables in your `.env` file.

5. Start the development server:

```bash
npm run dev
```

## Live Server

https://booknook-server-bzvz.onrender.com

## Related Repository

[ BoiGhor Client Repository](https://github.com/nafisa-israt/booknook)
