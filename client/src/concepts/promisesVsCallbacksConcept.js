/**
 * JavaScript Concept: Promises vs Callbacks
 * 
 * Demonstrates:
 * - Error-first callback pattern
 * - Callback Hell (pyramid of doom)
 * - ES6+ Promise construction and chaining
 * - Async / Await syntax
 * - Static Promise methods (all, allSettled, race, any)
 * - Bidirectional conversion (promisify, callbackify)
 * - Parallel & sequential flow comparisons
 * - Async retry implementations
 */

export * from '../utils/promisesVsCallbacks';
import {
    promisify,
    callbackify,
    getGeolocationCallback,
    getGeolocationPromise,
    preloadImageCallback,
    preloadImagePromise,
    readFileAsDataURLCallback,
    readFileAsDataURLPromise,
    parallelCallbacks,
    parallelPromises,
    executeAllSettled,
    executeRace,
    executeAny,
    sequentialCallbackFlow,
    sequentialPromiseFlow,
    sequentialAsyncAwaitFlow,
    retryCallback,
    retryPromise,
    compareCallbackVsPromise,
} from '../utils/promisesVsCallbacks';

export default {
    promisify,
    callbackify,
    getGeolocationCallback,
    getGeolocationPromise,
    preloadImageCallback,
    preloadImagePromise,
    readFileAsDataURLCallback,
    readFileAsDataURLPromise,
    parallelCallbacks,
    parallelPromises,
    executeAllSettled,
    executeRace,
    executeAny,
    sequentialCallbackFlow,
    sequentialPromiseFlow,
    sequentialAsyncAwaitFlow,
    retryCallback,
    retryPromise,
    compareCallbackVsPromise,
};
