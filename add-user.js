// Import required modules
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

// Initialize the app
const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.options('*', cors()); // Enable preflight requests for all routes


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
    const { first_name, last_name, email, contact, user_password} = req.body;

    // Validate the input
    if (!first_name || !last_name || !email || !contact || !user_password) {
        console.log("Validation failed: Missing fields");
        return res.status(400).json({ message: "All fields (first_name, last_name, email, contact, user_password) are required." });
    }

    try {
        // Insert data into the users table
        const result = await pool.query(
            "INSERT INTO users (first_name, last_name, email, contact, user_password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [first_name, last_name, email, contact, user_password]
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

// POST route for login
app.post("/login", async (req, res) => {
    console.log("Request body received:", req.body); 

    const { email, password } = req.body;

    // Validate the input
    if (!email || !password) {
        console.log("Validation failed: Missing fields");
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // Query to get the stored password for the given email
        const result = await pool.query(
            "SELECT user_password FROM users WHERE email = $1", 
            [email]
        );

        if (result.rows.length === 0) {
            // If no user found with the provided email
            return res.status(400).json({
                message: "Invalid email or password.",
            });
        }

        // Get the stored password from the query result
        const storedPassword = result.rows[0].user_password;

        // Compare the stored password with the provided password (assuming plaintext for now, should hash passwords in production)
        if (storedPassword === password) {
            // If the password matches
            res.status(200).json({
                message: "Login successful.",
                user: { email }, // Optionally return user details here
            });
        } else {
            // If the password doesn't match
            res.status(400).json({
                message: "Invalid email or password.",
            });
        }

    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({
            message: "An error occurred during login.",
            error: err.message,
        });
    }
});

// Set up the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

