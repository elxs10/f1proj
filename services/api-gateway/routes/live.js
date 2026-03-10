import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const cacheKey = `live:${session}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Live] ✅ Cache hit for session ${session}`);
            return res.status(200).json(JSON.parse(cached));
        }

        console.log(`[Live] ⚠️ Cache miss — fetching from OpenF1`);

        const [positionsRes, driversRes, stintsRes, intervalsRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/position?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/drivers?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/stints?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/intervals?session_key=${session}`).catch(() => ({ data: [] })),
        ]);

        if (!positionsRes.data || positionsRes.data.length === 0) {
            return res.status(404).json({ error: 'No live data found for this session' });
        }

        // Build driver map
        const driverMap = {};
        driversRes.data.forEach(d => {
            driverMap[d.driver_number] = d;
        });

        // Latest position per driver
        const latestPositions = {};
        positionsRes.data.forEach(p => {
            latestPositions[p.driver_number] = p;
        });

        // Latest stint per driver (tyre compound + laps on tyre)
        const latestStints = {};
        stintsRes.data.forEach(s => {
            const existing = latestStints[s.driver_number];
            if (!existing || s.stint_number > existing.stint_number) {
                latestStints[s.driver_number] = s;
            }
        });

        // Latest interval per driver (gap to leader)
        const latestIntervals = {};
        intervalsRes.data.forEach(i => {
            latestIntervals[i.driver_number] = i;
        });

        const TYRE_COLOURS = {
            SOFT: '#e8002d',
            MEDIUM: '#ffd700',
            HARD: '#ffffff',
            INTERMEDIATE: '#39b54a',
            WET: '#0067ff',
        };

        const drivers = Object.values(latestPositions)
            .sort((a, b) => a.position - b.position)
            .map(p => {
                const driver = driverMap[p.driver_number] || {};
                const stint = latestStints[p.driver_number] || {};
                const interval = latestIntervals[p.driver_number] || {};
                const compound = stint.compound || 'UNKNOWN';
                return {
                    position: p.position,
                    number: p.driver_number,
                    code: driver.name_acronym || `#${p.driver_number}`,
                    fullName: driver.full_name || '',
                    team: driver.team_name || '',
                    colour: driver.team_colour || '888888',
                    headshot: driver.headshot_url || '',
                    tyre: compound,
                    tyreColour: TYRE_COLOURS[compound] || '#888888',
                    tyreAge: stint.lap_end
                        ? stint.lap_end - (stint.lap_start || 1) + 1
                        : stint.lap_start
                            ? 1
                            : 0,
                    gap: interval.gap_to_leader ?? null,
                    interval: interval.interval ?? null,
                };
            });

        const data = { session, drivers, updatedAt: new Date().toISOString() };

        // Cache for 10 seconds during live session
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 10);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Live] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;