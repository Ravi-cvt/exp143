const express = require("express");
const Redis = require("ioredis");

const app = express();
app.use(express.json());

// Redis connection (Render provides REDIS_URL)
const redis = new Redis(process.env.REDIS_URL);

// Total seats
const TOTAL_SEATS = 100;
const SEAT_KEY = "available_seats";

// Home route
app.get("/", (req, res) => {
    res.send("Concurrent Ticket Booking System Running");
});

// Initialize seats
app.get("/init", async (req, res) => {
    try {
        await redis.set(SEAT_KEY, TOTAL_SEATS);
        res.json({
            message: "Seats initialized",
            totalSeats: TOTAL_SEATS
        });
    } catch (err) {
        res.status(500).json({ error: "Initialization failed" });
    }
});

// Booking API
app.post("/api/book", async (req, res) => {
    try {
        const remaining = await redis.decr(SEAT_KEY);

        if (remaining < 0) {
            await redis.incr(SEAT_KEY);
            return res.status(400).json({
                success: false,
                message: "Sold Out"
            });
        }

        res.json({
            success: true,
            bookingId: Date.now(),
            remainingSeats: remaining
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

// Render dynamic port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});