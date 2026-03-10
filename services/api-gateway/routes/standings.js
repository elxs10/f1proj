import express from 'express';
import axios from 'axios';

const router = express.Router();
const OPENF1_BASE = 'https://api.openf1.org/v1';


router.get('/', async (req, res) => {
    try {
        const session = req.query.session || 'latest';

        const [positionsRes, driversRes] = await Promise.all([
            axios.get(`${OPENF1_BASE}/position?session_key=${session}`),
            axios.get(`${OPENF1_BASE}/drivers?session_key=${session}`)
        ]);

        if (!positionsRes.data || positionsRes.data.length === 0) {
            return res.status(404).json({
                error: 'No standings found for this session'
            });
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

        res.status(200).json({
            session,
            standings
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
