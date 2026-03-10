import express from "express";
import axios from 'axios';

const router = express.Router();
const OPEN_F1_BASE = 'https://api.openf1.org/v1';

router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';
        const response = await axios.get(
            `${OPEN_F1_BASE}/drivers?session_key=${session}`
        );
        if (!response.data || response.data.length === 0) {
            return res.status(404).json({ error: 'No drivers found for the specified session' });
        }

        res.status(200).json({
            session,
            count: response.data.length,
            drivers: response.data.map(d => ({
                number: d.driver_number,
                code: d.name_acronym,
                fullName: d.full_name,
                team: d.team_name,
                colour: d.team_colour,
                headshot: d.headshot_url,
                country: d.country_code,
            }))
        });
    }
    catch (err) {
        console.error('Error fetching drivers:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
