const Redis = require('../dist');
const { expect } = require('chai');
const assert = require('assert');

const mountpoint = 'redis://localhost:6379';
const redis = new Redis(mountpoint);
let promises;

describe('redis-utils-json', () => {
  beforeEach( async () => {
    promises = [
      redis.setKey('test:a', { a: 1 }),
      redis.setKey('test:b', { b: 1 }),
      redis.setKey('test:c', { c: 1 }),
    ];
    await Promise.all(promises);
  });

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

  describe('setKey() and getByKey()', () => {
    it('setKey() should return a promise type', async () => {
      const response = redis.setKey('foo', { a: 1 });
      expect(typeof response).to.equal(typeof Promise.resolve());
    });

    it('Should be able to set and get a key', async () => {
      const inserted = { a: 1 };
      const key = 'oi';
      const toEqual = Object.assign({ key }, inserted);
      await redis.setKey(key, toEqual);
      const { data } = await redis.getByKey(key);
      expect(JSON.stringify(data)).to.equal(JSON.stringify(toEqual))
    });

    it('Should find our previous insertion', async () => {
      const { found } = await redis.getByKey('oi');
      expect(found).to.be.true;
    });

    it("Shouldn't find a key that we've set", async () => {
      const { found } = await redis.getByKey(Math.random());
      expect(found).to.be.false;
    });

    it("Should return '' on a key that we've not set", async () => {
      const { data } = await redis.getByKey(Math.random());
      expect(data).to.equal('');
    });

    it("Should overwrite 'oi'", async () => {
      const { data: oiVal } = await redis.getByKey('oi');
      await redis.setKey('oi', { a: 2 });
      const { data: newVal } = await redis.getByKey('oi');
      expect(JSON.stringify(newVal)).to.not.equal(JSON.stringify(oiVal));
    });
  });

  describe('getKeys()', () => {
    it('Should return an empty list on a non existent prefix', async () => {
      const { keys } = await redis.getKeys('a:*');
      expect(keys.length).to.equal(0);
    });

    it('Should show not found on non-existent prefix', async () => {
      const { found, keys } = await redis.getKeys('a:*');
      expect(found).to.be.false;
    });

    it('Should return 3 keys by prefix after setting them', async () => {
      const { keys } = await redis.getKeys('test:*');
      expect(keys.length).to.equal(promises.length);
    });

    it('Should return "found" after searching for a known prefix', async () => {
      const { found } = await redis.getKeys('test:*');
      expect(found).to.be.true;
    });

    it('Should give us more than 3 keys on getKeys with no args', async () => {
      const { keys } = await redis.getKeys();
      expect(keys.length).to.be.greaterThan(promises.length);
    })
  });

  describe('getByKeys()', () => {
    it('Should return 3 values based on 3 keys', async () => {
      const keys = ['test:a', 'test:b', 'test:c'];
      const result = await redis.getByKeys(...keys);
      expect(result.length).to.equal(keys.length);
    });

    it('Should return only found values', async () => {
      const keys = ['test:a', 'test:b', 'test:e'];
      const result = await redis.getByKeys(...keys);
      expect(result.length).to.not.equal(keys.length);
    });

    it('Should return nothing based on no keys', async () => {
      const result = await redis.getByKeys();
      expect(result.length).to.equal(0);
    });
  });

  describe('deleteKeys()', () => {
    beforeEach(async () => {
      promises = [
        redis.setKey('del:a', { a: 1 }),
        redis.setKey('del:b', { b: 1 }),
        redis.setKey('del:c', { c: 1 }),
      ];
      await Promise.all(promises);
    });

    it('Should delete a key', async () => {
      const key = 'del:a';
      await redis.deleteKey(key);
      const { found } = await redis.getByKey(key);
      expect(found).to.be.false;
    });

    it('Should delete many keys', async () => {
      const keys = ['del:a', 'del:b', 'del:c'];
      const data = await redis.getByKeys(...keys);
      await redis.deleteKeys(...keys);
      const resp = await redis.getByKeys(...keys);
      expect(resp.length).to.equal(0).to.not.equal(data.length);;
    })
  });

  describe('caching', () => {
    const promFunc = () => new Promise(res => res(3));
    const updPromFunc = () => new Promise(res => res(4));
    it('Will resolve 3 on getting by key', async () => {
      const key = 'cache';
      const data = await redis.lazyCache(key, promFunc);
      const data2 = await redis.lazyCache(key, promFunc);
      expect(data).to.equal(data2).to.equal(await promFunc());
    });

    it('Will return the cached item, not the latest', async () => {
      const key = 'cache2';
      // must delete key else it's saved from the second lazy cache and resolves
      // therefore the two are equale
      await redis.deleteKey(key);
      const data = await redis.lazyCache(key, promFunc);
      const data2 = await redis.lazyCache(key, updPromFunc);
      expect(data).to.equal(data2);
    });
  });
});
