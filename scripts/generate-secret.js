import crypto from 'crypto';

const generateSecret = () => crypto.randomBytes(32).toString('hex');

console.log('# Generated Secrets');
console.log('');
console.log(`PAYLOAD_SECRET=${generateSecret()}`);
console.log(`CRON_SECRET=${generateSecret()}`);
console.log(`PREVIEW_SECRET=${generateSecret()}`);
console.log('');
