const Keyv = require('keyv');

const redis_url = process.env.REDIS_URL

const keyv = redis_url ? new Keyv(redis_url) : new Keyv();

keyv.on('error', err => console.log('Connection Error', err));

exports.keyv = keyv;
