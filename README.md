# JSON Utils for Redis
> Storing data on your server has never been so easy

# Intro
Redis is great, but callback based libraries aren't. I created this library because I work with a lot os JSON responses, and I like to store thise in Redis. Redis is SUPER fast. If you're using Node >6.10, this is the library for you.

# Prerequisites
the only requirement is that you have a Redis server running. This is normally on `redis://localhost:6379`, or if you use Heorku - they'll give you the URL.

# Usage
```js
// ES5 imports
const Redis = require('redis-utils-json');
const client = new Redis('some-redis-url');

const { data, found } = await client.getKey('contentful:fhdjksd');
if (found) // do something with data

const keys = await client.getKeys('contentful:*')

await client.setKey('contentful:fhsdkjf', { oi: 'ayy ' })

await client.delKey('contentful:fhsdkjf')

// there's a really neat higher order caching function.
// say you want to cache an API response, you can use Redis#cache
// this checks redis for the key, and if found, resolves that data,
// before running the data getting function and updating the store
// if it's not found, you'll get the result of dataGettingFunction
// before the store is updated
const data = await cache('someKey', dataGettingFunction);
```
