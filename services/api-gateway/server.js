import express from 'express';
import cors from 'cors';
import axios from 'axios';
import driversRouter from './routes/drivers.js';
import telemetryRouter from './routes/telemetry.js';
import standingsRouter from './routes/standings.js';
import calendarRouter from './routes/calendar.js';
import historyRouter from './routes/history.js';
import trackRoutrer from './routes/track.js';
import liveRouter from './routes/live.js';


const PORT = process.env.PORT || 3000;
const app = express();
const OPEN_F1_BASE = 'https://api.openf1.org/v1';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestap: new Date().toISOString()
    });
}
);

app.get('/ready', (req, res) => {
    res.status(200).json({
        status: 'ready',
        service: 'api-gateway',
        timestap: new Date().toISOString()
    });
}
);

app.use('/api/drivers', driversRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/history', historyRouter);
app.use('/api/track', trackRoutrer);
app.use('/api/live', liveRouter);


app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.url} not found` });
});


app.listen(PORT, () => {
    console.log(`[Gateway] Running on http://localhost:${PORT}`);
    console.log(`[Gateway] Health → http://localhost:${PORT}/health`);
});
