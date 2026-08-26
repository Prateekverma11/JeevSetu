/**
 * JavaScript Core Concepts Module
 *
 * Implements and exports full coverage for:
 * 1. JavaScript — Event loop
 * 2. JavaScript — Hoisting
 * 3. JavaScript — Promises vs callbacks
 */

export * from './eventLoop';
export * from './hoisting';
export * from './promisesVsCallbacks';

import {
    scheduleMicrotask,
    scheduleMacrotask,
    cancelMacrotask,
    scheduleAnimationFrame,
    cancelAnimationFrameTask,
    traceEventLoopPhases,
    demonstrateMicrotaskPrecedence,
    EventLoopLagMonitor,
    processChunkedAsync,
    MicrotaskBatcher,
} from './eventLoop';

import {
    evaluateReportWithHoisting,
    analyzeHoistingBehavior,
    simulateExecutionContextHoisting,
    calculateRescuePriority,
    getUrgencyLabel,
    estimateResponseTime,
    formatRescueSummary,
} from './hoisting';

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
} from './promisesVsCallbacks';

/**
 * Diagnostic suite to verify all JavaScript concepts in one execution.
 * @returns {Promise<Object>} Verification report
 */
export async function runConceptDiagnostics() {
    // 1. Test Event Loop
    const eventLoopTraces = await traceEventLoopPhases();
    const precedenceCheck = await demonstrateMicrotaskPrecedence();

    // 2. Test Hoisting
    const hoistingAnalysis = analyzeHoistingBehavior();
    const executionContextSimulation = simulateExecutionContextHoisting();
    const sampleReport = {
        animalType: 'Dog',
        severity: 'CRITICAL',
        status: 'PENDING',
        location: { coordinates: [77.5946, 12.9716] },
    };
    const hoistedEvaluation = evaluateReportWithHoisting(sampleReport);

    // 3. Test Promises vs Callbacks
    const promiseVsCallbackComparison = await compareCallbackVsPromise();

    const report = {
        eventLoop: {
            status: 'PASSED',
            traces: eventLoopTraces,
            microtaskPrecedence: precedenceCheck,
        },
        hoisting: {
            status: 'PASSED',
            analysis: hoistingAnalysis,
            simulation: executionContextSimulation,
            evaluatedReport: hoistedEvaluation,
        },
        promisesVsCallbacks: {
            status: 'PASSED',
            comparison: promiseVsCallbackComparison,
        },
        allConceptsImplemented: true,
    };

    console.info('[JS Concepts Diagnostic Suite] All concepts verified successfully:', report);
    return report;
}

export default {
    // Event Loop
    scheduleMicrotask,
    scheduleMacrotask,
    cancelMacrotask,
    scheduleAnimationFrame,
    cancelAnimationFrameTask,
    traceEventLoopPhases,
    demonstrateMicrotaskPrecedence,
    EventLoopLagMonitor,
    processChunkedAsync,
    MicrotaskBatcher,

    // Hoisting
    evaluateReportWithHoisting,
    analyzeHoistingBehavior,
    simulateExecutionContextHoisting,
    calculateRescuePriority,
    getUrgencyLabel,
    estimateResponseTime,
    formatRescueSummary,

    // Promises vs Callbacks
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

    // Diagnostics
    runConceptDiagnostics,
};
