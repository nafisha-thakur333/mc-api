// Import required modules
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

// Initialize the app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Database connection setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use environment variable for security
    ssl: {
        rejectUnauthorized: false, // Use this for hosted Postgres services like NEON
    },
});

app.get("/", (req, res) => {
    res.send("Server is working!");
});
// POST route to add a user
app.post("/add-user", async (req, res) => {
    console.log("Request body received:", req.body); // Log the incoming request body

    // Destructure the required fields from the request body
    const { first_name, last_name, email, contact } = req.body;

    // Validate the input
    if (!first_name || !last_name || !email || !contact) {
        console.log("Validation failed: Missing fields");
        return res.status(400).json({ message: "All fields (first_name, last_name, email, contact) are required." });
    }

    try {
        // Insert data into the users table
        const result = await pool.query(
            "INSERT INTO users (first_name, last_name, email, contact) VALUES ($1, $2, $3, $4) RETURNING *",
            [first_name, last_name, email, contact]
        );

        console.log("Insert successful:", result.rows[0]);
        res.status(201).json({
            message: "User added successfully.",
            user: result.rows[0],
        });
    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({
            message: "An error occurred while adding the user.",
            error: err.message,
        });
    }
});

// Set up the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

