import express from 'express';
import axios from 'axios';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';

// GET /api/track?session=9693
router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';

        const [sessionRes, locationRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/sessions?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/location?session_key=${session}&driver_number=1`),
        ]);

        if (!sessionRes.data || sessionRes.data.length === 0) {
            return res.status(404).json({ error: 'No session found' });
        }

        const sessionInfo = sessionRes.data[0];

        // Filter out 0,0,0 points — car not moving yet
        const validPoints = locationRes.data.filter(
            p => p.x !== 0 && p.y !== 0
        );

        // Take every 20th point — enough to draw track shape
        const trackOutline = validPoints
            .filter((_, i) => i % 20 === 0)
            .map(p => ({
                x: p.x,
                y: p.y,
                z: p.z,
            }));

        res.status(200).json({
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
            totalPoints: trackOutline.length,
        });

    } catch (err) {
        if (err.response?.status === 429) {
            return res.status(429).json({
                error: 'OpenF1 rate limit hit — please wait 60 seconds',
                retryAfter: 60
            });
        }
        res.status(500).json({ error: err.message });
    }
});

export default router;