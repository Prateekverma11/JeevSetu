/**
 * JavaScript Concept: Event Loop
 * 
 * Demonstrates:
 * - Call Stack execution
 * - Microtask Queue (queueMicrotask, Promise microtasks)
 * - Macrotask Queue (setTimeout, setInterval, setImmediate)
 * - Render queue (requestAnimationFrame)
 * - Time-slicing and lag monitoring
 */

export * from '../utils/eventLoop';
import {
    scheduleMicrotask,
    scheduleMacrotask,
    scheduleAnimationFrame,
    traceEventLoopPhases,
    demonstrateMicrotaskPrecedence,
    EventLoopLagMonitor,
    processChunkedAsync,
    MicrotaskBatcher,
} from '../utils/eventLoop';

export default {
    scheduleMicrotask,
    scheduleMacrotask,
    scheduleAnimationFrame,
    traceEventLoopPhases,
    demonstrateMicrotaskPrecedence,
    EventLoopLagMonitor,
    processChunkedAsync,
    MicrotaskBatcher,
};
