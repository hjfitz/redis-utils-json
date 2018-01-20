import redis, { RedisClient } from 'redis';

// interface for returning a piece of data
interface Stored {
  found: boolean,
  data: any,
};

// interface for returning a list of keys
interface RetKeys {
  found: boolean,
  data: string[];
}


export default class Redis {
  client: RedisClient;

  /**
   * Create a promisified wrapper around Redis
   * @param url Where redis is mounted
   */
  constructor(url: string) {
    this.client = redis.createClient(url);
  }


  /**
   * Set a key-stringified-value pair in ur store
   * @param key Key to store value under
   * @param value JSON value to store within redis
   */
  setKey(key: string, value: object): Promise<any> {
    return new Promise((resolve, reject) => {
      // if we just want to store a value, don't bother adding a key
      if (!Array.isArray(value)) Object.assign(value, { key });
      const serialised: string = JSON.stringify(value);
      this.client.set(key, serialised, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  getByKey(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) return reject(err);
        const ret: Stored = { found: false, data: '' };
        if (reply) {
          ret.found = true;
          ret.data = reply;
        }
        resolve(ret);
      });
    });
  }

  /**
   * Promise wrapper to get corresponding keys from Redis
   * @param {string} key Key prefix for Redis
   */
  getKeys(prefix: string = ''): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.keys(prefix, (err, replies) => {
        if (err) return reject(err);
        const ret: RetKeys = { found: false, data: [] };
        if (replies) {
          ret.found = true;
          ret.data = replies;
        }
        resolve(ret);
      });
    });
  }

  /**
   * Promise wrapper for redis.delKey
   * @param {string} key key to remove from redis
   */
  deleteKey(key: string): Promise<any> {
    return new Promise(resolve => this.client.del(key, resolve));
  }

  /**
   * lazy caching
   * Have we found something? great, resolve and then update the cache
   * Not found? get fresh data, and then add it to the cache
   * Promises don't exit upon resolve
   *  -- JavaScript only does this when it throws an error, or returns something
   * @param {function} callback function to get data
   * @param {string} key used to set and retrieve data from redis
   */
  async lazyCache(key: string, callback: Function): Promise<any> {
    const { data, found }: Stored = await this.getByKey(key);
    return new Promise(resolve => {
      if (found) {
        resolve(data);
        // by not awaiting, we're not blocking the software
        callback().then(fresh => this.setKey(key, fresh));
      } else {
        // tricky. get fresh data and resolve the *original* promise
        // then, set the key
        callback().then(fresh => {
          resolve(fresh);
          this.setKey(key, fresh);
        });
      }
    });
  }
}