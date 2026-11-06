

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI);

// JWT verification using Better Auth JWKS
let jose;
let JWKS;

const getJWKS = async () => {
  if (!jose) {
    jose = await import("jose");
  }

  if (!JWKS) {
    JWKS = jose.createRemoteJWKSet(
      new URL(process.env.BETTER_AUTH_JWKS_URL)
    );
  }

  return JWKS;
};

// Authentication middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        message: "Unauthorized: Token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const jwks = await getJWKS();

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.BETTER_AUTH_URL,
    });

    if (!payload.id || !payload.email) {
      return res.status(401).send({
        message: "Invalid token payload",
      });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    return res.status(401).send({
      message: "Invalid or expired token",
    });
  }
};

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully!");

    const db = client.db("boighor");

    const booksCollection = db.collection("books");
    const borrowsCollection = db.collection("borrows");

    app.locals.db = db;

    // GET all books - Public
    // GET all books - Public
    app.get("/books", async (req, res) => {
      try {
        const books = await booksCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();

        res.send(books);
      } catch (error) {
        console.error("GET BOOKS ERROR:", error);

        res.status(500).send({
          message: "Failed to fetch books",
          error: error.message,
        });
      }
    });

    // GET single book - Public
    app.get("/books/:id", async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id)) {
          return res.status(400).send({
            message: "Invalid book ID",
          });
        }

        const book = await booksCollection.findOne({
          _id: new ObjectId(req.params.id),
        });

        if (!book) {
          return res.status(404).send({
            message: "Book not found",
          });
        }

        res.send(book);
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch book",
        });
      }
    });

    // POST new book - Protected
    app.post("/books", verifyToken, async (req, res) => {
try {
const { title, author, category, description, image } = req.body;
const allowedCategories = [
  "Fiction",
  "Science",
  "History",
  "Kids",
  "Others",
];

if (
  !title?.trim() ||
  !author?.trim() ||
  !description?.trim() ||
  !image?.trim() ||
  !allowedCategories.includes(category)
) {
  return res.status(400).send({
    message: "All book fields are required and category must be valid",
  });
}

const totalCopies = Number(req.body.totalCopies);

if (!Number.isInteger(totalCopies) || totalCopies < 1) {
  return res.status(400).send({
    message: "Total copies must be a positive integer",
  });
}

        const book = {
          title: req.body.title,
          author: req.body.author,
          category: req.body.category,
          description: req.body.description,
          image: req.body.image,

          totalCopies,
          availableCopies: totalCopies,

          addedBy: req.body.addedBy || req.user.email,
          addedByEmail: req.user.email,
          addedById: req.user.id,

          createdAt: new Date(),
        };

        const result = await booksCollection.insertOne(book);

        res.status(201).send({
          message: "Book added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to add book",
        });
      }
    });

    // PATCH book - Owner only
    app.patch("/books/:id", verifyToken, async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id)) {
          return res.status(400).send({
            message: "Invalid book ID",
          });
        }

        const bookId = new ObjectId(req.params.id);

        const book = await booksCollection.findOne({
          _id: bookId,
          addedByEmail: req.user.email,
        });

        if (!book) {
          return res.status(404).send({
            message: "Book not found or access denied",
          });
        }

        const updateFields = {};

        const allowedFields = [
          "title",
          "author",
          "category",
          "description",
          "image",
        ];

        allowedFields.forEach((field) => {
          if (req.body[field] !== undefined) {
            updateFields[field] = req.body[field];
          }
        });

        if (req.body.totalCopies !== undefined) {
          const newTotal = Number(req.body.totalCopies);

          if (!Number.isInteger(newTotal) || newTotal < 1) {
            return res.status(400).send({
              message: "Invalid total copies",
            });
          }

          const borrowedCopies =
            book.totalCopies - book.availableCopies;

          if (newTotal < borrowedCopies) {
            return res.status(400).send({
              message: "Cannot reduce copies below borrowed copies",
            });
          }

          updateFields.totalCopies = newTotal;
          updateFields.availableCopies = newTotal - borrowedCopies;
        }

        if (Object.keys(updateFields).length === 0) {
          return res.status(400).send({
            message: "No valid fields to update",
          });
        }

        const result = await booksCollection.updateOne(
          {
            _id: bookId,
            addedByEmail: req.user.email,
          },
          {
            $set: updateFields,
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            message: "Book not found or access denied",
          });
        }

        res.send({
          message: "Book updated successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to update book",
        });
      }
    });

    // DELETE book - Owner only
    app.delete("/books/:id", verifyToken, async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id)) {
          return res.status(400).send({
            message: "Invalid book ID",
          });
        }

        const bookId = new ObjectId(req.params.id);

        const book = await booksCollection.findOne({
          _id: bookId,
          addedByEmail: req.user.email,
        });

        if (!book) {
          return res.status(404).send({
            message: "Book not found or access denied",
          });
        }

        const activeBorrow = await borrowsCollection.findOne({
          bookId: req.params.id,
          status: "borrowed",
        });

        if (activeBorrow) {
          return res.status(400).send({
            message: "Cannot delete a book that is currently borrowed",
          });
        }

        await booksCollection.deleteOne({
          _id: bookId,
          addedByEmail: req.user.email,
        });

        res.send({
          message: "Book deleted successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to delete book",
        });
      }
    });
    // POST borrow book - Protected
    app.post("/borrows", verifyToken, async (req, res) => {
      try {
        const { bookId, borrowDate, returnDate } = req.body;

        if (
          !bookId ||
          !ObjectId.isValid(bookId) ||
          !borrowDate ||
          !returnDate ||
          Number.isNaN(Date.parse(borrowDate)) ||
          Number.isNaN(Date.parse(returnDate)) ||
          new Date(returnDate) <= new Date(borrowDate)
        ) {
          return res.status(400).send({
            message: "Valid book ID, borrow date and future return date are required",
          });
        }

        const book = await booksCollection.findOne({
          _id: new ObjectId(bookId),
        });

        if (!book) {
          return res.status(404).send({
            message: "Book not found",
          });
        }

        const existingBorrow = await borrowsCollection.findOne({
          bookId,
          userEmail: req.user.email,
          status: "borrowed",
        });

        if (existingBorrow) {
          return res.status(400).send({
            message: "You have already borrowed this book",
          });
        }

        const updateResult = await booksCollection.updateOne(
          {
            _id: new ObjectId(bookId),
            availableCopies: { $gt: 0 },
          },
          {
            $inc: { availableCopies: -1 },
          }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(400).send({
            message: "This book is currently unavailable",
          });
        }

        const borrow = {
          bookId,
          bookTitle: book.title,
          bookImage: book.image,
          userEmail: req.user.email,
          userId: req.user.id,
          borrowDate,
          returnDate,
          status: "borrowed",
          createdAt: new Date(),
        };

        try {
          const result = await borrowsCollection.insertOne(borrow);

          res.status(201).send({
            message: "Book borrowed successfully",
            insertedId: result.insertedId,
          });
        } catch (error) {
          await booksCollection.updateOne(
            { _id: new ObjectId(bookId) },
            { $inc: { availableCopies: 1 } }
          );

          throw error;
        }
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to borrow book",
        });
      }
    });


    // RETURN borrowed book - Owner only
    app.delete("/borrows/:id", verifyToken, async (req, res) => {
      try {
        if (!ObjectId.isValid(req.params.id)) {
          return res.status(400).send({
            message: "Invalid borrow ID",
          });
        }

        const borrowId = new ObjectId(req.params.id);

        const borrow = await borrowsCollection.findOne({
          _id: borrowId,
          userEmail: req.user.email,
          status: "borrowed",
        });

        if (!borrow) {
          return res.status(404).send({
            message: "Borrow record not found or access denied",
          });
        }

        const result = await borrowsCollection.updateOne(
          {
            _id: borrowId,
            userEmail: req.user.email,
            status: "borrowed",
          },
          {
            $set: {
              status: "returned",
              returnedAt: new Date(),
            },
          }
        );

        if (result.modifiedCount === 0) {
          return res.status(400).send({
            message: "Book has already been returned",
          });
        }

        await booksCollection.updateOne(
          {
            _id: new ObjectId(borrow.bookId),
          },
          {
            $inc: { availableCopies: 1 },
          }
        );

        res.send({
          message: "Book returned successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to return book",
        });
      }
    });

    // Home route
    app.get("/", (req, res) => {
      res.send("BoiGhor Server is Running!");
    });

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`BoiGhor Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run();
