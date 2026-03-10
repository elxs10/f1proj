import axios from 'axios';
import redis from './db/redis.js';
import pool from './db/postgres.js';

const BASE_URL = 'https://api.openf1.org/v1';
const SESSION = '9158';
const POLL_INTERVAL = 30000;

async function fetchAndSaveDrivers() {
    console.log('[Fetcher] Fetching drivers...');

    const response = await axios.get(
        `${BASE_URL}/drivers?session_key=${SESSION}`
    );
    const drivers = response.data;

    if (!drivers || drivers.length === 0) {
        console.warn('[Fetcher] No drivers found');
        return [];
    }

    await redis.set(
        `drivers:${SESSION}`,
        JSON.stringify(drivers),
        'EX', 60
    );

    for (const d of drivers) {
        await pool.query(
            `INSERT INTO drivers 
        (session_key, driver_number, code, full_name, team_name, team_colour, headshot_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (session_key, driver_number) DO UPDATE SET
        team_name   = EXCLUDED.team_name,
        team_colour = EXCLUDED.team_colour`,
            [SESSION, d.driver_number, d.name_acronym, d.full_name,
                d.team_name, d.team_colour, d.headshot_url]
        );
    }


    console.log(`[Fetcher] ✅ Saved ${drivers.length} drivers`);
    return drivers;
}




async function fetchAndSaveTelemetry(driverNumber) {
    const response = await axios.get(
        `${BASE_URL}/car_data?driver_number=${driverNumber}&session_key=${SESSION}`
    );
    const carData = response.data;

    if (!carData || carData.length === 0) return;


    const latest = carData.find(p => Number(p.speed) > 100);
    if (!latest) return;

    const telemetry = {
        driver_number: driverNumber,
        speed: Number(latest.speed),
        rpm: Number(latest.rpm),
        gear: Number(latest.n_gear),
        throttle: Number(latest.throttle),
        brake: latest.brake,
        drs: latest.drs === 1 ? 'OPEN' : 'CLOSED',
        time: latest.date,
        chartData: carData.slice(-50).map(p => ({
            speed: Number(p.speed),
            rpm: Number(p.rpm),
            throttle: Number(p.throttle),
            time: p.date
        }))
    };

    await redis.set(
        `telemetry:${driverNumber}`,
        JSON.stringify(telemetry),
        'EX', 30
    );

    console.log(`[Fetcher] ✅ Telemetry saved for #${driverNumber}`);
}

async function main() {
    console.log('[Fetcher] Starting poll cycle...');

    try {
        const drivers = await fetchAndSaveDrivers();

        if (drivers.length > 0) {
            await Promise.all(
                drivers.map(d => fetchAndSaveTelemetry(d.driver_number))
            );
        }

        console.log('[Fetcher] ✅ Poll cycle complete');
    } catch (err) {
        if (err.response?.status === 429) {
            console.warn('[Fetcher] ⚠️ Rate limited by OpenF1 — skipping cycle');
        } else {
            console.error('[Fetcher] ❌ Error:', err.message);
        }
    }
}
main();
setInterval(main, POLL_INTERVAL);