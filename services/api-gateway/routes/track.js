import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const cacheKey = `track:${session}`;

        // Step 1 — Check Redis
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Track] ✅ Cache hit for session ${session}`);
            return res.status(200).json(JSON.parse(cached));
        }

        // Step 2 — Hit OpenF1 directly
        console.log(`[Track] ⚠️ Cache miss — fetching from OpenF1`);
        const [sessionRes, locationRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/sessions?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/location?session_key=${session}&driver_number=1`),
        ]);

        if (!sessionRes.data || sessionRes.data.length === 0) {
            return res.status(404).json({ error: 'No session found' });
        }

        const sessionInfo = sessionRes.data[0];

        const validPoints = locationRes.data.filter(
            p => p.x !== 0 && p.y !== 0
        );

        const trackOutline = validPoints
            .filter((_, i) => i % 5 === 0)
            .map(p => ({ x: p.x, y: p.y, z: p.z }));

        // Split into 3 sectors (equal thirds)
        const total = trackOutline.length;
        const s1End = Math.floor(total * 0.33);
        const s2End = Math.floor(total * 0.66);
        const sector1 = trackOutline.slice(0, s1End + 1);
        const sector2 = trackOutline.slice(s1End, s2End + 1);
        const sector3 = trackOutline.slice(s2End);

        const data = {
            session,
            track: {
                name: sessionInfo.circuit_short_name,
                location: sessionInfo.location,
                country: sessionInfo.country_name,
                countryCode: sessionInfo.country_code,
                year: sessionInfo.year,
                sessionName: sessionInfo.session_name,
                sessionType: sessionInfo.session_type,
                dateStart: sessionInfo.date_start,
                dateEnd: sessionInfo.date_end,
            },
            trackOutline,
            sectors: { sector1, sector2, sector3 },
            totalPoints: trackOutline.length,
        };

        // Save to Redis — 7 days (circuit never changes)
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 604800);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Track] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;