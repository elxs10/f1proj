import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.warn(`[Redis] Reconnecting in ${delay}ms...`);
        return delay;
    }
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err));
redis.on('reconnecting', (delay) => console.log(`[Redis] Reconnecting in ${delay}ms...`));

export default redis;
