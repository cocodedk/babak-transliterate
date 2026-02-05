import assert from 'node:assert/strict';
import { test } from 'node:test';
import ApiClient from '../src/shared/api-client.js';

test('ApiClient buildHeaders adds Authorization and optional headers', () => {
  const client = new ApiClient();
  const headers = client.buildHeaders({
    apiKey: 'abc123',
    httpReferer: 'https://example.com/',
    xTitle: 'My App'
  });

  assert.equal(headers['Authorization'], 'Bearer abc123');
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers['HTTP-Referer'], 'https://example.com/');
  assert.equal(headers['X-Title'], 'My App');
});

test('ApiClient buildHeaders strips non-ISO-8859-1 characters', () => {
  const client = new ApiClient();
  const headers = client.buildHeaders({
    apiKey: 'abc123',
    httpReferer: 'https://example.com/🚀',
    xTitle: 'My App 🚀'
  });

  assert.equal(headers['HTTP-Referer'], 'https://example.com/');
  assert.equal(headers['X-Title'], 'My App ');
});

test('ApiClient buildHeaders rejects API key with unsupported characters', () => {
  const client = new ApiClient();

  assert.throws(() => {
    client.buildHeaders({
      apiKey: 'abc🚀',
      httpReferer: '',
      xTitle: ''
    });
  }, /API key contains unsupported characters/i);
});

test('ApiClient sanitizeHeaderValue removes CRLF', () => {
  const client = new ApiClient();
  const value = client.sanitizeHeaderValue('hello\r\nworld');

  assert.equal(value, 'helloworld');
});
