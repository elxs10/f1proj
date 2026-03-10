const BASE_URL = 'http://10.0.2.2:3000';

export const api = {

    getDrivers: async (session: string) => {
        const res = await fetch(`${BASE_URL}/api/drivers?session=${session}`);
        return res.json();
    },

    getTelemetry: async (driver: number, session: string) => {
        const res = await fetch(`${BASE_URL}/api/telemetry?driver=${driver}&session=${session}`);
        return res.json();
    },

    getStandings: async (session: string) => {
        const res = await fetch(`${BASE_URL}/api/standings?session=${session}`);
        return res.json();
    },

    getCalendar: async (year: string = '2026') => {
        const res = await fetch(`${BASE_URL}/api/calendar?year=${year}`);
        return res.json();
    },

    getHistory: async (year: string = '2026') => {
        const res = await fetch(`${BASE_URL}/api/history?year=${year}`);
        return res.json();
    },

    getRaceResult: async (session: string) => {
        const res = await fetch(`${BASE_URL}/api/history?session=${session}`);
        return res.json();
    },

    getLive: async (session: string = 'latest') => {
        const res = await fetch(`${BASE_URL}/api/live?session=${session}`);
        return res.json();
    },

    getTrack: async (session: string) => {
        const res = await fetch(`${BASE_URL}/api/track?session=${session}`);
        return res.json();
    },

};