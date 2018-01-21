"use strict";

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
class Redis {
    /**
     * Create a promisified wrapper around Redis
     * @param url Where redis is mounted
     */
    constructor(url) {
        this._client = redis.createClient(url);
        this._url = url;
        this._connected = false;
        this._client.addListener('connect', () => this._connected = true);
        // needed to use 'this' within getByKeys
        this.getByKey = this.getByKey.bind(this);
    }
    get status() {
        return {
            connected: this._connected,
            mounted: this._url
        };
    }
    /**
     * Set a key-stringified-value pair in ur store
     * @param key Key to store value under
     * @param value JSON value to store within redis
     */
    setKey(key, value) {
        return new Promise((resolve, reject) => {
            // if we just want to store a value, don't bother adding a key
            if (!Array.isArray(value)) Object.assign(value, { key });
            const serialised = JSON.stringify(value);
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
    getByKey(key) {
        return new Promise((resolve, reject) => {
            this._client.get(key, (err, reply) => {
                if (err) return reject(err);
                const ret = { found: false, data: '' };
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
    getByKeys(...keys) {
        return Promise.all(keys.map(this.getByKey));
    }
    /**
     * Promise wrapper to get corresponding keys from Redis
     * @param {string} key Key prefix for Redis
     */
    getKeys(prefix = '') {
        return new Promise((resolve, reject) => {
            this._client.keys(prefix, (err, replies) => {
                if (err) return reject(err);
                const ret = { found: false, keys: [] };
                if (replies) {
                    ret.found = replies.length !== 0;
                    ret.keys = replies;
                }
                resolve(ret);
            });
        });
    }
    /**
     * Promise wrapper for redis.delKey
     * @param {string} key key to remove from redis
     */
    deleteKey(key) {
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
    lazyCache(key, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, found } = yield this.getByKey(key);
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
        });
    }
}
// allow for nicer importing
module.exports = Redis;
//# sourceMappingURL=index.js.map
