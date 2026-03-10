import express from 'express';
import axios from 'axios';
import redis from '../db/redis.js';
import pool from '../db/postgres.js';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const year = req.query.year || '2025';
        const session = req.query.session || null;

        // ── SESSION MODE ──────────────────────────────
        if (session) {
            const cacheKey = `history:session:${session}`;

            // Step 1 — Check Redis
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`[History] ✅ Cache hit for session ${session}`);
                return res.status(200).json(JSON.parse(cached));
            }

            // Step 2 — Hit OpenF1 directly
            console.log(`[History] ⚠️ Cache miss — fetching session ${session} from OpenF1`);
            const [posRes, driversRes, lapsRes, stintsRes, pitsRes] = await Promise.all([
                axios.get(`${OPENF1_BASE}/position?session_key=${session}`),
                axios.get(`${OPENF1_BASE}/drivers?session_key=${session}`),
                axios.get(`${OPENF1_BASE}/laps?session_key=${session}`),
                axios.get(`${OPENF1_BASE}/stints?session_key=${session}`),
                axios.get(`${OPENF1_BASE}/pit?session_key=${session}`),
            ]);

            const driverMap = {};
            driversRes.data.forEach(d => { driverMap[d.driver_number] = d; });

            const finalPositions = {};
            posRes.data.forEach(p => { finalPositions[p.driver_number] = p.position; });

            const fastestLaps = {};
            lapsRes.data.forEach(lap => {
                const dn = lap.driver_number;
                if (lap.lap_duration && (!fastestLaps[dn] || lap.lap_duration < fastestLaps[dn])) {
                    fastestLaps[dn] = lap.lap_duration;
                }
            });

            let overallFastest = null;
            let overallFastestDriver = null;
            Object.entries(fastestLaps).forEach(([dn, time]) => {
                if (!overallFastest || time < overallFastest) {
                    overallFastest = time;
                    overallFastestDriver = Number(dn);
                }
            });

            const pitMap = {};
            pitsRes.data.forEach(p => {
                if (!pitMap[p.driver_number]) pitMap[p.driver_number] = [];
                pitMap[p.driver_number].push({ lap: p.lap_number, duration: p.pit_duration });
            });

            const stintMap = {};
            stintsRes.data.forEach(s => {
                if (!stintMap[s.driver_number]) stintMap[s.driver_number] = [];
                stintMap[s.driver_number].push({
                    compound: s.compound,
                    lapStart: s.lap_start,
                    lapEnd: s.lap_end,
                    tyreAge: s.tyre_age_at_start,
                });
            });

            const results = Object.keys(finalPositions)
                .map(dn => {
                    const driver = driverMap[dn] || {};
                    return {
                        position: finalPositions[dn],
                        number: Number(dn),
                        code: driver.name_acronym,
                        fullName: driver.full_name,
                        team: driver.team_name,
                        colour: driver.team_colour,
                        fastestLap: fastestLaps[dn] || null,
                        pits: pitMap[dn] || [],
                        stints: stintMap[dn] || [],
                    };
                })
                .sort((a, b) => a.position - b.position);

            const fastestDriver = driverMap[overallFastestDriver] || {};
            const data = {
                session,
                fastestLap: {
                    time: overallFastest,
                    driver: fastestDriver.name_acronym,
                    fullName: fastestDriver.full_name,
                },
                results,
            };

            // Save to Redis — 24 hours (race never changes)
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);

            return res.status(200).json(data);
        }

        // ── YEAR MODE ─────────────────────────────────
        const cacheKey = `history:year:${year}`;

        // Step 1 — Check Redis
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[History] ✅ Cache hit for year ${year}`);
            return res.status(200).json(JSON.parse(cached));
        }

        // Step 2 — Check Postgres
        const result = await pool.query(
            'SELECT * FROM calendar WHERE year = $1 ORDER BY date_start ASC',
            [year]
        );
        if (result.rows.length > 0) {
            console.log(`[History] ✅ Postgres hit for year ${year}`);
            const data = { year, totalRaces: result.rows.length, history: result.rows };
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
            return res.status(200).json(data);
        }

        // Step 3 — Hit OpenF1 directly
        console.log(`[History] ⚠️ Cache miss — fetching year ${year} from OpenF1`);
        const [meetingsRes, sessionsRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/meetings?year=${year}`),
            axios.get(`${OPENF1_BASE}/sessions?year=${year}&session_name=Race`),
        ]);

        if (!meetingsRes.data || meetingsRes.data.length === 0) {
            return res.status(404).json({ error: `No history found for ${year}` });
        }

        const raceSessionMap = {};
        sessionsRes.data.forEach(s => { raceSessionMap[s.meeting_key] = s.session_key; });

        const history = meetingsRes.data
            .filter(m => raceSessionMap[m.meeting_key])
            .map(m => ({
                round: m.meeting_key,
                name: m.meeting_name,
                location: m.location,
                country: m.country_name,
                circuit: m.circuit_short_name,
                date: m.date_start,
                sessionKey: raceSessionMap[m.meeting_key],
            }));

        const data = { year, totalRaces: history.length, history };

        // Save to Redis — 1 hour
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);

        return res.status(200).json(data);

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limited', retryAfter: 60 });
        }
        console.error('[History] ❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;