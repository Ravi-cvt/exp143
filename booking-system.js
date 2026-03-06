const express = require("express");
const Redis = require("ioredis");

// create express app FIRST
const app = express();

app.use(express.json());

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

// seat key
const SEAT_KEY = "available_seats";

// API
app.post("/api/book", async (req, res) => {
    try {
        const remaining = await redis.decr(SEAT_KEY);

        if (remaining < 0) {
            await redis.incr(SEAT_KEY);
            return res.status(400).json({
                success: false,
                message: "Sold Out!"
            });
        }

        res.json({
            success: true,
            bookingId: Date.now(),
            remaining
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

// Render dynamic port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Booking system running on port ${PORT}`);
});