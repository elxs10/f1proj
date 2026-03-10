import express from 'express';
import axios from 'axios';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const year = req.query.year || '2024';

        const [meetingsRes, sessionsRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/meetings?year=${year}`),
            axios.get(`${OPENF1_BASE}/sessions?year=${year}`)
        ]);

        if (!meetingsRes.data || meetingsRes.data.length === 0) {
            return res.status(404).json({
                error: `No meetings found for ${year}`
            });
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

        res.status(200).json({
            year,
            totalRounds: calendar.length,
            calendar
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;