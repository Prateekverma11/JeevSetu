/**
 * JavaScript Core Concept Implementation: Promises vs Callbacks
 *
 * Comprehensive implementation and comparison of JavaScript Asynchronous Paradigms:
 * 1. Error-First Callback Pattern (Continuation-Passing Style: (err, result) => void)
 * 2. Nested Callbacks ("Callback Hell" / Pyramid of Doom)
 * 3. ES6+ Promises (.then, .catch, .finally chaining)
 * 4. Async / Await Modern Syntax
 * 5. Static Promise Combinators (Promise.all, Promise.allSettled, Promise.race, Promise.any, Promise.resolve, Promise.reject)
 * 6. Bidirectional Converters: `promisify` and `callbackify`
 * 7. Parallel Coordination: Callbacks vs Promises
 * 8. Sequential Pipeline: Callbacks vs Promises
 * 9. Retry Mechanisms: Callbacks vs Promises
 * 10. Real-world Browser Async Adapters (Geolocation, Image Preloader, FileReader)
 * 11. Comparative Benchmark Suite
 */

// ─── 1. Core Bidirectional Converters ─────────────────────────────────────────

/**
 * Promisify: Converts an error-first callback function into a function returning a Promise.
 * Follows the standard Node.js / Browser convention `callback(err, value)`.
 *
 * @param {Function} callbackFn - Function expecting (..., callback)
 * @returns {Function} Function returning Promise<any>
 */
export function promisify(callbackFn) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            try {
                callbackFn.call(this, ...args, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            } catch (syncError) {
                reject(syncError);
            }
        });
    };
}

/**
 * Callbackify: Converts a Promise-returning async function into an error-first callback function.
 *
 * @param {Function} promiseFn - Function returning a Promise
 * @returns {Function} Function accepting trailing callback(err, value)
 */
export function callbackify(promiseFn) {
    return function (...args) {
        const callback = args[args.length - 1];
        if (typeof callback !== 'function') {
            throw new TypeError('The last argument must be a callback function (err, result) => void');
        }
        const innerArgs = args.slice(0, -1);

        try {
            Promise.resolve(promiseFn.apply(this, innerArgs))
                .then((result) => {
                    callback(null, result);
                })
                .catch((err) => {
                    callback(err, null);
                });
        } catch (syncError) {
            callback(syncError, null);
        }
    };
}

// ─── 2. Browser API Adapters (Callbacks vs Promises) ──────────────────────────

/**
 * Geolocation with Callbacks (Native Browser Pattern).
 *
 * @param {Object} options - Position options
 * @param {function(Error|null, Object|null): void} callback
 */
export function getGeolocationCallback(options = {}, callback) {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback function required');
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return callback(new Error('Geolocation is not supported by this browser/environment'), null);
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            callback(null, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
            });
        },
        (error) => {
            callback(new Error(`Geolocation error (${error.code}): ${error.message}`), null);
        },
        options
    );
}

/**
 * Geolocation with Promises (Promisified Pattern).
 *
 * @param {Object} options - Position options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, timestamp: number}>}
 */
export const getGeolocationPromise = promisify(getGeolocationCallback);

/**
 * Image Preloader using Callback Pattern.
 *
 * @param {string} src - Image URL
 * @param {function(Error|null, HTMLImageElement|null): void} callback
 */
export function preloadImageCallback(src, callback) {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback function required');
    }
    if (typeof Image === 'undefined') {
        return callback(new Error('Image constructor not available in environment'), null);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => callback(null, img);
    img.onerror = () => callback(new Error(`Failed to load image at: ${src}`), null);
    img.src = src;
}

/**
 * Image Preloader using Promise Pattern.
 *
 * @param {string} src - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
export const preloadImagePromise = promisify(preloadImageCallback);

/**
 * FileReader Read As Data URL using Callback Pattern.
 *
 * @param {Blob|File} file - The file to read
 * @param {function(Error|null, string|null): void} callback
 */
export function readFileAsDataURLCallback(file, callback) {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback function required');
    }
    if (typeof FileReader === 'undefined') {
        return callback(new Error('FileReader is not available in environment'), null);
    }
    const reader = new FileReader();
    reader.onload = () => callback(null, reader.result);
    reader.onerror = () => callback(reader.error || new Error('FileReader encountered an error'), null);
    reader.readAsDataURL(file);
}

/**
 * FileReader Read As Data URL using Promise Pattern.
 *
 * @param {Blob|File} file - The file to read
 * @returns {Promise<string>}
 */
export const readFileAsDataURLPromise = promisify(readFileAsDataURLCallback);

// ─── 3. Parallel Task Coordination (Callbacks vs Promises) ───────────────────

/**
 * Parallel Execution with Error-First Callbacks (Manual Barrier / Counter).
 * Executes multiple async tasks in parallel and invokes callback with all results or first error.
 *
 * @param {Array<function(function(Error|null, any): void): void>} tasks - Array of callback tasks
 * @param {function(Error|null, Array<any>|null): void} finalCallback
 */
export function parallelCallbacks(tasks, finalCallback) {
    if (typeof finalCallback !== 'function') {
        throw new TypeError('Final callback must be a function');
    }
    if (!tasks || tasks.length === 0) {
        return finalCallback(null, []);
    }

    const results = new Array(tasks.length);
    let completedCount = 0;
    let hasFailed = false;

    tasks.forEach((task, index) => {
        task((err, data) => {
            if (hasFailed) return;
            if (err) {
                hasFailed = true;
                return finalCallback(err, null);
            }
            results[index] = data;
            completedCount++;
            if (completedCount === tasks.length) {
                finalCallback(null, results);
            }
        });
    });
}

/**
 * Parallel Execution with Promises (Wrapper around Promise.all with timing stats).
 *
 * @param {Array<Promise<any>|Function>} tasks - Array of promises or promise factory functions
 * @returns {Promise<{results: Array<any>, executionTimeMs: number}>}
 */
export async function parallelPromises(tasks) {
    const startTime = performance.now();
    const promiseList = tasks.map((t) => (typeof t === 'function' ? t() : t));
    const results = await Promise.all(promiseList);
    const executionTimeMs = performance.now() - startTime;
    return { results, executionTimeMs };
}

/**
 * Parallel Execution with Promise.allSettled.
 *
 * @param {Array<Promise<any>>} promises
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: any, reason?: any}>>}
 */
export async function executeAllSettled(promises) {
    return Promise.allSettled(promises);
}

/**
 * Race Execution with Promise.race.
 *
 * @param {Array<Promise<any>>} promises
 * @returns {Promise<any>}
 */
export async function executeRace(promises) {
    return Promise.race(promises);
}

/**
 * Any Execution with Promise.any.
 *
 * @param {Array<Promise<any>>} promises
 * @returns {Promise<any>}
 */
export async function executeAny(promises) {
    return Promise.any(promises);
}

// ─── 4. Sequential Flow Control: Callback Hell vs Promise Chaining vs Async/Await

/**
 * Sequential execution using Nested Callbacks (Demonstrating "Callback Hell" / "Pyramid of Doom").
 *
 * @param {number} initialValue
 * @param {function(Error|null, number|null): void} callback
 */
export function sequentialCallbackFlow(initialValue, callback) {
    const step = (val, delay, cb) => setTimeout(() => cb(null, val + 10), delay);

    step(initialValue, 10, (err1, res1) => {
        if (err1) return callback(err1, null);
        step(res1, 10, (err2, res2) => {
            if (err2) return callback(err2, null);
            step(res2, 10, (err3, res3) => {
                if (err3) return callback(err3, null);
                step(res3, 10, (err4, res4) => {
                    if (err4) return callback(err4, null);
                    callback(null, res4);
                });
            });
        });
    });
}

/**
 * Sequential execution using Promise Chaining (Clean Linear Flow).
 *
 * @param {number} initialValue
 * @returns {Promise<number>}
 */
export function sequentialPromiseFlow(initialValue) {
    const step = (val, delay) =>
        new Promise((resolve) => setTimeout(() => resolve(val + 10), delay));

    return step(initialValue, 10)
        .then((res1) => step(res1, 10))
        .then((res2) => step(res2, 10))
        .then((res3) => step(res3, 10));
}

/**
 * Sequential execution using Async / Await.
 *
 * @param {number} initialValue
 * @returns {Promise<number>}
 */
export async function sequentialAsyncAwaitFlow(initialValue) {
    const step = (val, delay) =>
        new Promise((resolve) => setTimeout(() => resolve(val + 10), delay));

    let current = initialValue;
    current = await step(current, 10);
    current = await step(current, 10);
    current = await step(current, 10);
    current = await step(current, 10);
    return current;
}

// ─── 5. Async Retry Mechanism (Callbacks vs Promises) ─────────────────────────

/**
 * Retry an asynchronous callback operation.
 *
 * @param {Function} taskFn - (callback) => void
 * @param {number} maxRetries
 * @param {number} delayMs
 * @param {Function} finalCallback - (err, result) => void
 */
export function retryCallback(taskFn, maxRetries = 3, delayMs = 100, finalCallback) {
    let attempts = 0;

    function attempt() {
        attempts++;
        taskFn((err, result) => {
            if (!err) {
                return finalCallback(null, result);
            }
            if (attempts >= maxRetries) {
                return finalCallback(new Error(`Failed after ${attempts} attempts. Last error: ${err?.message || err}`), null);
            }
            setTimeout(attempt, delayMs);
        });
    }

    attempt();
}

/**
 * Retry an asynchronous Promise operation.
 *
 * @param {function(): Promise<T>} taskFn
 * @param {number} maxRetries
 * @param {number} delayMs
 * @returns {Promise<T>}
 */
export async function retryPromise(taskFn, maxRetries = 3, delayMs = 100) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await taskFn();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message || lastError}`);
}

// ─── 6. Side-by-Side Comparison Runner ────────────────────────────────────────

/**
 * Compares the execution and outcome of Callback vs Promise implementations side by side.
 *
 * @returns {Promise<{callbackResult: number, promiseResult: number, asyncAwaitResult: number, matches: boolean}>}
 */
export async function compareCallbackVsPromise() {
    const callbackResult = await new Promise((resolve, reject) => {
        sequentialCallbackFlow(100, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });

    const promiseResult = await sequentialPromiseFlow(100);
    const asyncAwaitResult = await sequentialAsyncAwaitFlow(100);

    return {
        callbackResult,
        promiseResult,
        asyncAwaitResult,
        matches: callbackResult === promiseResult && promiseResult === asyncAwaitResult,
    };
}
