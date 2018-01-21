const Redis = require('../dist');
const { expect } = require('chai');
const assert = require('assert');

const mountpoint = 'redis://localhost:6379';
const redis = new Redis(mountpoint);

describe('redis-utils-json', () => {

  describe('get status()', () => {
    it("Shouldn't connect on an invalid URI", () => {
      const redis = new Redis('invalidURI');
      expect(redis.status.connected).to.equal(false);
    });
  
    it("Should show connected in status, if it 's connected", () => {
      expect(redis.status.connected).to.equal(true);
    });

    it ("Should show the connect url in status", () => {
      expect(redis.status.mounted).to.equal(mountpoint);
    });
  });

  describe('setting and getting keys', () => {
    it('setKey() should return a promise type', async () => {
      const response = redis.setKey('foo', { a: 1 });
      expect(typeof response).to.equal(typeof Promise.resolve());
    });

    it('')
  })
});
