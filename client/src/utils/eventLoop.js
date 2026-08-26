/**
 * JavaScript Core Concept Implementation: Event Loop
 * 
 * Comprehensive implementation and demonstration of the JavaScript Event Loop runtime model:
 * 1. Call Stack (Synchronous Execution Phase)
 * 2. Microtask Queue (queueMicrotask, Promise.then, Promise.catch, Promise.finally, MutationObserver)
 * 3. Macrotask Queue / Task Queue (setTimeout, setInterval, setImmediate, MessageChannel, I/O)
 * 4. Render Phase / Animation Queue (requestAnimationFrame)
 * 5. Event Loop Lag & Main Thread Blocking Detection
 * 6. Cooperative Time-Slicing (chunked processing without UI thread starvation)
 * 7. Microtask Batching & Coalescing
 * 8. Microtask Priority vs Macrotask Race Demonstration
 * 9. DOM Event Dispatch in Event Loop
 */

/**
 * Schedule a task on the Microtask Queue.
 * Microtasks execute immediately after the current synchronous script and before rendering or macrotasks.
 *
 * @param {Function} callback - Function to execute as a microtask
 */
export function scheduleMicrotask(callback) {
    if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => {
            try {
                callback();
            } catch (err) {
                console.error('[EventLoop:Microtask Error]', err);
            }
        });
    } else if (typeof Promise !== 'undefined') {
        Promise.resolve()
            .then(callback)
            .catch((err) => console.error('[EventLoop:Promise Microtask Error]', err));
    } else {
        setTimeout(callback, 0);
    }
}

/**
 * Schedule a task on the Macrotask Queue (Task Queue).
 * Macrotasks run in subsequent event loop iterations after all microtasks are drained.
 *
 * @param {Function} callback - Function to execute as a macrotask
 * @param {number} delayMs - Delay in milliseconds (default: 0)
 * @returns {number|NodeJS.Timeout} Timer identifier
 */
export function scheduleMacrotask(callback, delayMs = 0) {
    return setTimeout(() => {
        try {
            callback();
        } catch (err) {
            console.error('[EventLoop:Macrotask Error]', err);
        }
    }, delayMs);
}

/**
 * Cancel a scheduled macrotask.
 * @param {number|NodeJS.Timeout} timerId
 */
export function cancelMacrotask(timerId) {
    clearTimeout(timerId);
}

/**
 * Schedule a task during the browser's render phase before layout & paint.
 *
 * @param {Function} callback - Function to execute during animation frame
 * @returns {number} Request ID
 */
export function scheduleAnimationFrame(callback) {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        return window.requestAnimationFrame(callback);
    }
    return scheduleMacrotask(callback, 16);
}

/**
 * Cancel an animation frame task.
 * @param {number} frameId
 */
export function cancelAnimationFrameTask(frameId) {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
    } else {
        clearTimeout(frameId);
    }
}

/**
 * Executes a full trace through all phases of the JavaScript Event Loop.
 * Demonstrates the strict order:
 *  1. Call Stack (Synchronous)
 *  2. Microtask Queue (queueMicrotask & Promise.then)
 *  3. Render Phase (requestAnimationFrame)
 *  4. Macrotask Queue (setTimeout 0, setTimeout delay)
 *
 * @returns {Promise<Array<{order: number, phase: string, message: string, timestamp: number}>>}
 */
export function traceEventLoopPhases() {
    return new Promise((resolve) => {
        const traces = [];
        let orderCounter = 1;

        const record = (phase, message) => {
            traces.push({
                order: orderCounter++,
                phase,
                message,
                timestamp: performance.now(),
            });
        };

        // 1. Synchronous Execution (Call Stack)
        record('CallStack (Synchronous)', '1. Call Stack: Synchronous task 1 executed immediately');

        // 2. Schedule Macrotask (setTimeout 0)
        scheduleMacrotask(() => {
            record('Macrotask Queue', '6. Macrotask (setTimeout 0) executed after all microtasks');
            resolve(traces);
        }, 0);

        // 3. Schedule Microtask via queueMicrotask
        scheduleMicrotask(() => {
            record('Microtask Queue', '3. Microtask 1 (queueMicrotask) executed before any macrotask');
        });

        // 4. Schedule Microtask via Promise.resolve().then()
        Promise.resolve().then(() => {
            record('Microtask Queue', '4. Microtask 2 (Promise.resolve().then) executed in microtask queue');
        });

        // 5. Schedule Render Phase Task via requestAnimationFrame
        scheduleAnimationFrame(() => {
            record('Render Phase (rAF)', '5. Animation Frame executed prior to browser repaint');
        });

        // 1b. Synchronous Execution (Call Stack finishes)
        record('CallStack (Synchronous)', '2. Call Stack: Synchronous task 2 executed immediately');
    });
}

/**
 * Demonstrates that Microtasks have strict priority over Macrotasks.
 * Even if a setTimeout is set to 0ms, any scheduled microtask runs first.
 *
 * @returns {Promise<{sequence: Array<string>, microtaskWon: boolean}>}
 */
export function demonstrateMicrotaskPrecedence() {
    return new Promise((resolve) => {
        const sequence = [];

        setTimeout(() => {
            sequence.push('macrotask-setTimeout-0ms');
            resolve({
                sequence,
                microtaskWon: sequence[0] === 'microtask-queueMicrotask',
            });
        }, 0);

        queueMicrotask(() => {
            sequence.push('microtask-queueMicrotask');
        });
    });
}

/**
 * EventLoopLagMonitor:
 * Measures the responsiveness of the JavaScript event loop by detecting latency/lag
 * when synchronous work blocks the main thread.
 */
export class EventLoopLagMonitor {
    constructor(sampleIntervalMs = 100) {
        this.sampleIntervalMs = sampleIntervalMs;
        this.timerId = null;
        this.lastTickTime = null;
        this.lagHistory = [];
        this.maxHistorySize = 50;
        this.isMonitoring = false;
        this.onLagSample = null;
    }

    start(onLagSample = null) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.onLagSample = onLagSample;
        this.lastTickTime = performance.now();

        this.timerId = setInterval(() => {
            const now = performance.now();
            const elapsed = now - this.lastTickTime;
            const lag = Math.max(0, elapsed - this.sampleIntervalMs);

            this.lagHistory.push(lag);
            if (this.lagHistory.length > this.maxHistorySize) {
                this.lagHistory.shift();
            }

            if (typeof this.onLagSample === 'function') {
                this.onLagSample({
                    lagMs: Number(lag.toFixed(2)),
                    averageLagMs: Number(this.getAverageLag().toFixed(2)),
                    isMainThreadBlocked: lag > 50,
                });
            }

            this.lastTickTime = performance.now();
        }, this.sampleIntervalMs);
    }

    stop() {
        if (!this.isMonitoring) return;
        clearInterval(this.timerId);
        this.timerId = null;
        this.isMonitoring = false;
    }

    getAverageLag() {
        if (this.lagHistory.length === 0) return 0;
        const sum = this.lagHistory.reduce((acc, curr) => acc + curr, 0);
        return sum / this.lagHistory.length;
    }
}

/**
 * Cooperative Task Runner (Time-Slicing) using the Event Loop.
 * Slices heavy CPU calculations across multiple event loop turns to prevent freezing the UI.
 *
 * @param {Array<any>} items - Array of data items to process
 * @param {function(any, number): any} processFn - Processor function for each item
 * @param {Object} options - Configuration options
 * @param {number} [options.chunkSize=50] - Number of items to process per chunk
 * @param {number} [options.maxYieldTimeMs=12] - Time budget per frame (in ms)
 * @param {function(number, number): void} [options.onProgress] - Progress callback
 * @returns {Promise<Array<any>>}
 */
export function processChunkedAsync(items, processFn, options = {}) {
    const { chunkSize = 50, maxYieldTimeMs = 12, onProgress = null } = options;

    return new Promise((resolve, reject) => {
        if (!Array.isArray(items) || items.length === 0) {
            resolve([]);
            return;
        }

        const results = new Array(items.length);
        let currentIndex = 0;
        const total = items.length;

        function processNextChunk() {
            try {
                const chunkStartTime = performance.now();

                while (currentIndex < total) {
                    results[currentIndex] = processFn(items[currentIndex], currentIndex);
                    currentIndex++;

                    const elapsed = performance.now() - chunkStartTime;
                    if (currentIndex % chunkSize === 0 || elapsed >= maxYieldTimeMs) {
                        if (onProgress) {
                            onProgress(currentIndex, total);
                        }
                        if (currentIndex < total) {
                            scheduleMacrotask(processNextChunk, 0);
                            return;
                        }
                    }
                }

                if (onProgress) {
                    onProgress(total, total);
                }
                resolve(results);
            } catch (error) {
                reject(error);
            }
        }

        scheduleMicrotask(processNextChunk);
    });
}

/**
 * MicrotaskBatcher:
 * Coalesces rapid synchronous calls within the same tick and flushes them in a single batch
 * using the microtask queue before browser paint.
 */
export class MicrotaskBatcher {
    constructor(flushCallback) {
        this.flushCallback = flushCallback;
        this.queue = [];
        this.isScheduled = false;
    }

    add(item) {
        this.queue.push(item);
        if (!this.isScheduled) {
            this.isScheduled = true;
            scheduleMicrotask(() => {
                const batch = this.queue.slice();
                this.queue = [];
                this.isScheduled = false;
                if (typeof this.flushCallback === 'function') {
                    this.flushCallback(batch);
                }
            });
        }
    }

    clear() {
        this.queue = [];
        this.isScheduled = false;
    }
}
