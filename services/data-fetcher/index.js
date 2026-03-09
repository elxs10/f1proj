import axios from 'axios';

const BASE_URL = 'https://api.openf1.org/v1';
const SESSION = '9158'; // Monaco 2024 Qualifying — swap to 'latest' on race day

async function fetchDrivers() {
    const response = await axios.get(`${BASE_URL}/drivers?session_key=${SESSION}`);
    return response.data;
}

async function fetchCarData(driverNumber) {
    const response = await axios.get(
        `${BASE_URL}/car_data?driver_number=${driverNumber}&session_key=${SESSION}`
    );
    return response.data;
}

async function main() {
    console.log('[Fetcher] Starting...');

    const drivers = await fetchDrivers();

    if (!drivers || drivers.length === 0) {
        console.warn('[Fetcher] No drivers found — no live session right now');
        return;
    }

    console.log(`[Fetcher] Found ${drivers.length} drivers in session ${SESSION}`);
    console.log('[Fetcher] Drivers:');
    drivers.forEach(d => {
        console.log(`  #${d.driver_number}  ${d.full_name}  —  ${d.team_name}`);
    });

    // Fetch car data for Verstappen (#1)
    const driverNumber = drivers[0].driver_number;
    console.log(`\n[Fetcher] Fetching car data for #${driverNumber} ${drivers[0].full_name}...`);

    const carData = await fetchCarData(driverNumber);

    if (!carData || carData.length === 0) {
        console.warn('[Fetcher] No car data available');
        return;
    }

    const latest = carData.find(point => Number(point.speed) > 100);

    console.log(`[Fetcher] Got ${carData.length} data points`);
    console.log('─────────────────────────────────');
    console.log(`Driver  : ${drivers[0].full_name}`);
    console.log(`Team    : ${drivers[0].team_name}`);
    console.log(`Speed   : ${Number(latest.speed)} km/h`);
    console.log(`RPM     : ${Number(latest.rpm)}`);
    console.log(`Gear    : ${Number(latest.n_gear)}`);
    console.log(`Throttle: ${Number(latest.throttle)}%`);
    console.log(`Brake   : ${latest.brake}`);
    console.log(`DRS     : ${latest.drs === 1 ? 'OPEN' : 'CLOSED'}`);
    console.log(`Time    : ${latest.date}`);
    console.log('─────────────────────────────────');
}

main();