import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';
import pool from '../db/postgres.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const cacheKey = `drivers:${session}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Drivers] ✅ Cache hit for session ${session}`);
            return res.status(200).json(JSON.parse(cached));
        }
        const result = await pool.query(
            'SELECT * FROM drivers WHERE session_key = $1',
            [session]
        );
        if (result.rows.length > 0) {
            console.log(`[Drivers] ✅ Postgres hit for session ${session}`);
            const data = formatDrivers(session, result.rows);
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
            return res.status(200).json(data);
        }


        console.log(`[Drivers] ⚠️ Cache miss — fetching from OpenF1`);
        const response = await axios.get(
            `${OPENF1_BASE}/drivers?session_key=${session}`
        );
        if (!response.data || response.data.length === 0) {
            return res.status(404).json({ error: 'No drivers found' });
        }

        const data = formatDrivers(session, response.data);


        await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);

        for (const d of response.data) {
            await pool.query(
                `INSERT INTO drivers
          (session_key, driver_number, code, full_name, team_name, team_colour, headshot_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (session_key, driver_number) DO UPDATE SET
          team_name   = EXCLUDED.team_name,
          team_colour = EXCLUDED.team_colour`,
                [session, d.driver_number, d.name_acronym, d.full_name,
                    d.team_name, d.team_colour, d.headshot_url]
            );
        }

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Drivers] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});




function formatDrivers(session, drivers) {
    return {
        session,
        count: drivers.length,
        drivers: drivers.map(d => ({
            number: d.driver_number,
            code: d.name_acronym || d.code,
            fullName: d.full_name,
            team: d.team_name,
            colour: d.team_colour || d.team_colour,
            headshot: d.headshot_url,
            country: d.country_code || null,
        }))
    };
}

export default router;