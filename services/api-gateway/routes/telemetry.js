import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const driverNumber = req.query.driver;

        if (!driverNumber) {
            return res.status(400).json({
                error: 'driver query param required. Example: ?driver=1&session=9158'
            });
        }

        const cacheKey = `telemetry:${driverNumber}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Telemetry] ✅ Cache hit for driver #${driverNumber}`);
            return res.status(200).json(JSON.parse(cached));
        }
        console.log(`[Telemetry] ⚠️ Cache miss — fetching from OpenF1`);
        const response = await axios.get(
            `${OPENF1_BASE}/car_data?driver_number=${driverNumber}&session_key=${session}`
        );

        if (!response.data || response.data.length === 0) {
            return res.status(404).json({
                error: 'No telemetry found for this driver and session'
            });
        }

        const movingData = response.data.filter(p => Number(p.speed) > 0);
        const latest = movingData[movingData.length - 1];

        const data = {
            session,
            driverNumber: Number(driverNumber),
            totalPoints: response.data.length,
            latest: {
                speed: Number(latest.speed),
                rpm: Number(latest.rpm),
                gear: Number(latest.n_gear),
                throttle: Number(latest.throttle),
                brake: Boolean(latest.brake),
                drs: latest.drs === 1 ? 'open' : 'closed',
                time: latest.date,
            },
            chartData: movingData.slice(-50).map(p => ({
                speed: Number(p.speed),
                rpm: Number(p.rpm),
                gear: Number(p.n_gear),
                throttle: Number(p.throttle),
                time: p.date,
            }))
        };
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 30);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Telemetry] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
