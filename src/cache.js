const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

let isConnected = false;
let redis = null;
const memoryCache = new Map();

try {
  redis = new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't spam retries if offline
    enableOfflineQueue: false,
    connectTimeout: 2000
  });

  redis.on('connect', () => {
    isConnected = true;
    console.log('✓ Successfully connected to Redis Cache.');
  });

  redis.on('error', (err) => {
    isConnected = false;
  });
} catch (err) {
  isConnected = false;
}

async function getCache(key) {
  if (isConnected && redis) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return memoryCache.get(key) || null;
}

async function setCache(key, value, ttlSeconds = 60) {
  if (isConnected && redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch {
      // fallback
    }
  }
  memoryCache.set(key, value);
}

function checkRedisHealth() {
  return isConnected;
}

module.exports = {
  getCache,
  setCache,
  checkRedisHealth
};
