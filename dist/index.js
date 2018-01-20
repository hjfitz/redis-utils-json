'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

;
class Redis {
    /**
     * Create a promisified wrapper around Redis
     * @param url Where redis is mounted
     */
    constructor(url) {
        this.client = _redis2.default.createClient(url);
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
            this.client.set(key, serialised, (err, reply) => {
                if (err) return reject(err);
                resolve(reply);
            });
        });
    }
    getByKey(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if (err) return reject(err);
                const ret = { found: false, data: '' };
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
    getKeys(prefix = '') {
        return new Promise((resolve, reject) => {
            this.client.keys(prefix, (err, replies) => {
                if (err) return reject(err);
                const ret = { found: false, data: [] };
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
    deleteKey(key) {
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
exports.default = Redis;
//# sourceMappingURL=index.js.map
