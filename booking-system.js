const express = require('express');
const Redis = require('ioredis');

const app = express();
const redis = new Redis(process.env.REDIS_URL);
app.use(express.json());

const TOTAL_SEATS = 100;
const SEAT_KEY = "seats_left";

// Setup: Reset seats on startup
async function setup() {
    await redis.set(SEAT_KEY, TOTAL_SEATS);
    console.log(`✅ System Initialized: ${TOTAL_SEATS} seats available.`);
}
setup();

app.post('/api/book', async (req, res) => {
    try {
        // Atomic DECR prevents race conditions
        const remaining = await redis.decr(SEAT_KEY);

        if (remaining >= 0) {
            // Success: Seat confirmed
            const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            return res.status(200).json({
                success: true,
                bookingId: bookingId,
                remaining: remaining
            });
        } else {
            // Failure: Rollback the decrement if we hit negative
            await redis.incr(SEAT_KEY);
            return res.status(400).json({
                success: false,
                message: "Sold out!"
            });
        }
    } catch (err) {
        console.error("Redis Error:", err);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

app.listen(3000, () => console.log("🚀 Server listening on port 3000"));