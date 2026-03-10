import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';
import pool from '../db/postgres.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const year = req.query.year || '2025';
        const cacheKey = `calendar:${year}`;

        // Step 1 — Check Redis
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Calendar] ✅ Cache hit for ${year}`);
            return res.status(200).json(JSON.parse(cached));
        }

        // Step 2 — Check Postgres
        const result = await pool.query(
            'SELECT * FROM calendar WHERE year = $1 ORDER BY date_start ASC',
            [year]
        );
        if (result.rows.length > 0) {
            console.log(`[Calendar] ✅ Postgres hit for ${year}`);
            const data = formatCalendar(year, result.rows);
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
            return res.status(200).json(data);
        }

        // Step 3 — Hit OpenF1 directly
        console.log(`[Calendar] ⚠️ Cache miss — fetching from OpenF1`);
        const [meetingsRes, sessionsRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/meetings?year=${year}`),
            axios.get(`${OPENF1_BASE}/sessions?year=${year}`)
        ]);

        if (!meetingsRes.data || meetingsRes.data.length === 0) {
            return res.status(404).json({ error: `No meetings found for ${year}` });
        }

        const sessionsByMeeting = {};
        sessionsRes.data.forEach(s => {
            if (!sessionsByMeeting[s.meeting_key]) {
                sessionsByMeeting[s.meeting_key] = [];
            }
            sessionsByMeeting[s.meeting_key].push({
                sessionKey: s.session_key,
                sessionName: s.session_name,
                sessionType: s.session_type,
                dateStart: s.date_start,
                dateEnd: s.date_end,
            });
        });

        const calendar = meetingsRes.data.map(m => ({
            round: m.meeting_key,
            name: m.meeting_name,
            officialName: m.meeting_official_name,
            location: m.location,
            country: m.country_name,
            countryCode: m.country_code,
            circuit: m.circuit_short_name,
            dateStart: m.date_start,
            year: m.year,
            sessions: sessionsByMeeting[m.meeting_key] || []
        }));

        // Save to Postgres
        for (const m of meetingsRes.data) {
            await pool.query(
                `INSERT INTO calendar
          (meeting_key, meeting_name, location, country, year, date_start)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (meeting_key) DO UPDATE SET
          meeting_name = EXCLUDED.meeting_name`,
                [m.meeting_key, m.meeting_name, m.location,
                m.country_name, m.year, m.date_start]
            );
        }

        const data = { year, totalRounds: calendar.length, calendar };

        // Save to Redis — expires in 1 hour
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[Calendar] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

function formatCalendar(year, rows) {
    return {
        year,
        totalRounds: rows.length,
        calendar: rows.map(r => ({
            round: r.meeting_key,
            name: r.meeting_name,
            location: r.location,
            country: r.country,
            dateStart: r.date_start,
            year: r.year,
            sessions: []
        }))
    };
}

export default router;