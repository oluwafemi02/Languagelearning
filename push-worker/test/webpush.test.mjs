import assert from 'node:assert/strict';
import ece from 'http_ece';
import crypto from 'node:crypto';
import { jwtVerify, importJWK } from 'jose';
import { encryptPayload, vapidAuthHeader, generateVapidKeys, b64url } from '../src/webpush.js';

// Fake browser subscription
const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
const auth = crypto.randomBytes(16);
const sub = { endpoint: 'https://web.push.apple.com/QAbc', keys: { p256dh: b64url(ua.getPublicKey()), auth: b64url(auth) } };
const msg = JSON.stringify({ title: 'Laikas mokytis!', body: 'Tavo serija: 12 dienų. Ąčęėįšųūž' });
const body = Buffer.from(await encryptPayload(sub, msg));
const plain = ece.decrypt(body, { version: 'aes128gcm', privateKey: ua, authSecret: auth });
assert.equal(plain.toString(), msg);
console.log('✓ payload decrypts');

const keys = await generateVapidKeys();
const h = await vapidAuthHeader(sub.endpoint, { ...keys, subject: 'mailto:a@b.c' });
const token = h.match(/t=([^,]+)/)[1];
const pub = { ...keys.privateJwk }; delete pub.d; delete pub.key_ops;
const { payload } = await jwtVerify(token, await importJWK(pub, 'ES256'));
assert.equal(payload.aud, 'https://web.push.apple.com');
assert.equal(payload.sub, 'mailto:a@b.c');
assert.ok(h.includes('k=' + keys.publicKey));
console.log('✓ VAPID token verifies');
