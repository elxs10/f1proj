import express from 'express';
import cors from 'cors';
import axios from 'axios';
import driversRouter from './routes/drivers.js';


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



app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.url} not found` });
});


app.listen(PORT, () => {
    console.log(`[Gateway] Running on http://localhost:${PORT}`);
    console.log(`[Gateway] Health → http://localhost:${PORT}/health`);
});
