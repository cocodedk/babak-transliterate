import assert from 'node:assert/strict';
import { test } from 'node:test';
import ScriptCipher from '../src/shared/script-cipher.js';

if (typeof globalThis.btoa !== 'function') {
  globalThis.btoa = (input) => Buffer.from(input, 'binary').toString('base64');
}
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (input) => Buffer.from(input, 'base64').toString('binary');
}

test('ScriptCipher encrypt/decrypt roundtrip', () => {
  const cipher = new ScriptCipher();
  const plaintext = 'hello world';
  const key = 'test-passphrase';

  const encrypted = cipher.encrypt(plaintext, key);
  const decrypted = cipher.decrypt(encrypted, key);

  assert.equal(decrypted, plaintext);
});

test('ScriptCipher encryption uses random salt', () => {
  const cipher = new ScriptCipher();
  const plaintext = 'repeatable';
  const key = 'test-passphrase';

  const first = cipher.encrypt(plaintext, key);
  const second = cipher.encrypt(plaintext, key);

  assert.notEqual(first, second);
});

test('ScriptCipher decrypt with wrong key returns different text', () => {
  const cipher = new ScriptCipher();
  const plaintext = 'top secret message';
  const key = 'right-key';
  const wrongKey = 'wrong-key';

  const encrypted = cipher.encrypt(plaintext, key);
  const decrypted = cipher.decrypt(encrypted, wrongKey);

  assert.notEqual(decrypted, plaintext);
});

test('ScriptCipher decrypt invalid ciphertext returns null', () => {
  const cipher = new ScriptCipher();
  const originalError = console.error;
  console.error = () => {};
  const decrypted = cipher.decrypt('not-base64', 'key');
  console.error = originalError;

  assert.equal(decrypted, null);
});
