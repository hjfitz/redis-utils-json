import * as redis from 'redis';

// piece of data stored in redis
interface Stored {
  found: boolean,
  data: any,
};

// list of keys
interface ReturnedKeys {
  found: boolean,
  data: string[];
}

// current status
interface Status {
  connected: Boolean,
  mounted: string,
}

class Redis {
  _client: redis.RedisClient;
  _url: string;
  _connected: Boolean; 

  /**
   * Create a promisified wrapper around Redis
   * @param url Where redis is mounted
   */
  constructor(url: string) {
    this._client = redis.createClient(url);
    this._url = url;
    this._connected = false;
    this._client.addListener('connect', () => this._connected = true);
  }

  get status(): Status {
    return {
      connected: this._connected,
      mounted: this._url,
    };
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
      this._client.set(key, serialised, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  /**
   * Get data from redis and parse to JSON
   * @param key data stored by this key 
   */
  getByKey(key: string): Promise<Stored> {
    return new Promise((resolve, reject) => {
      this._client.get(key, (err, reply) => {
        if (err) return reject(err);
        const ret: Stored = { found: false, data: '' };
        if (reply) {
          ret.found = true;
          ret.data = JSON.parse(reply);
        }
        resolve(ret);
      });
    });
  }

  /**
   * Asynchronously get a load of data from redis
   * @param keys Any number of keys to retrieve
   */
  getByKeys(...keys: string[]): Promise<Array<object>> {
    return Promise.all(keys.map(this.getByKey));
  }

  /**
   * Promise wrapper to get corresponding keys from Redis
   * @param {string} key Key prefix for Redis
   */
  getKeys(prefix: string = ''): Promise<any> {
    return new Promise((resolve, reject) => {
      this._client.keys(prefix, (err, replies) => {
        if (err) return reject(err);
        const ret: ReturnedKeys = { found: false, data: [] };
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
    return new Promise(resolve => this._client.del(key, resolve));
  }

  /**
   * lazy caching
   * Have we found something? great, resolve and then update the cache
   * Not found? get fresh data, and then add it to the cache
   * Promises don't exit upon resolve
   *  -- JavaScript only does this when it throws an error, or returns something
   * @param {function} callback MUST BE A FUNCTION THAT RETURNS A PROMISE. function to get data
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

// allow for nicer importing
module.exports = Redis;