import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const cacheKey = `standings:${session}`;

        // Step 1 — Check Redis
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Standings] ✅ Cache hit for session ${session}`);
            return res.status(200).json(JSON.parse(cached));
        }

        // Step 2 — Hit OpenF1 directly
        console.log(`[Standings] ⚠️ Cache miss — fetching from OpenF1`);
        const [positionsRes, driversRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/position?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/drivers?session_key=${session}`)
        ]);

        if (!positionsRes.data || positionsRes.data.length === 0) {
            return res.status(404).json({ error: 'No standings found for this session' });
        }

        const driverMap = {};
        driversRes.data.forEach(d => {
            driverMap[d.driver_number] = d;
        });

        const latestPositions = {};
        positionsRes.data.forEach(p => {
            latestPositions[p.driver_number] = p;
        });

        const standings = Object.values(latestPositions)
            .sort((a, b) => a.position - b.position)
            .map(p => {
                const driver = driverMap[p.driver_number] || {};
                return {
                    position: p.position,
                    number: p.driver_number,
                    code: driver.name_acronym,
                    fullName: driver.full_name,
                    team: driver.team_name,
                    colour: driver.team_colour,
                    headshot: driver.headshot_url,
                };
            });

        const data = { session, standings };

        // Save to Redis — expires in 30 seconds
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 30);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Standings] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;