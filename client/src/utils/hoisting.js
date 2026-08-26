/**
 * JavaScript Core Concept Implementation: Hoisting
 *
 * Comprehensive implementation and demonstration of JavaScript Hoisting mechanics:
 * 1. Function Declaration Hoisting (functions can be called before declaration in source code)
 * 2. Variable Hoisting with `var` (declarations hoisted and initialized to `undefined`)
 * 3. Temporal Dead Zone (TDZ) with `let` and `const` (declarations hoisted into uninitialized state)
 * 4. Function Declarations vs Function Expressions vs Arrow Functions
 * 5. Class Declaration Hoisting (Classes are in TDZ and cannot be accessed before declaration)
 * 6. Execution Context Phases: Creation Phase (Lexical/Variable Environment) vs Execution Phase
 * 7. Real-world Rescue Priority & Urgency Hoisted Utility Suite
 */

// ─── 1. Practical Demonstration of Function Declaration Hoisting ─────────────
// The function evaluateReportWithHoisting calls calculateRescuePriority,
// getUrgencyLabel, formatRescueSummary, and estimateResponseTime BEFORE their
// declarations appear in this file.

/**
 * Evaluates an incoming rescue report by utilizing hoisted helper functions.
 * Demonstrates that Function Declarations are hoisted along with their full bodies.
 *
 * @param {Object} report - Animal report data
 * @returns {Object} Evaluated report with calculated priority, ETA, and summary
 */
export function evaluateReportWithHoisting(report) {
    // Calling hoisted function declaration before its definition in code
    const priorityScore = calculateRescuePriority(report.severity, report.animalType);

    // Calling another hoisted function declaration
    const urgencyLabel = getUrgencyLabel(priorityScore);

    // Calling hoisted ETA calculation
    const estimatedMinutes = estimateResponseTime(report.severity, priorityScore);

    // Calling hoisted formatter function
    const summary = formatRescueSummary(report, priorityScore, urgencyLabel);

    return {
        ...report,
        priorityScore,
        urgencyLabel,
        estimatedMinutes,
        summary,
        evaluationTimestamp: Date.now(),
    };
}

// ─── 2. Temporal Dead Zone (TDZ) & Variable Hoisting Analyzer ────────────────

/**
 * Demonstrates and analyzes the differences between `var`, `let`, `const`, and `class` hoisting.
 *
 * - `var`: Hoisted to function scope and initialized to `undefined`.
 * - `let`/`const`: Hoisted to block scope, placed in Temporal Dead Zone (TDZ) until evaluation.
 * - Function Expression (`var fn = function()`): Variable hoisted as `undefined`, invocation throws `TypeError`.
 * - Function Declaration (`function fn()`): Fully hoisted with implementation, invocation succeeds.
 * - Class Declaration: Exists in TDZ, instantiation throws `ReferenceError`.
 *
 * @returns {Array<Object>} Analysis results of JS hoisting rules
 */
export function analyzeHoistingBehavior() {
    const findings = [];

    // Test 1: Var Hoisting
    function testVarHoisting() {
        // Accessing 'hoistedVar' before its declaration line returns 'undefined'
        var isAccessibleBefore = typeof hoistedVar; // 'undefined'
        var hoistedVar = 'I am initialized now';
        return {
            isAccessibleBefore,
            valueAfter: hoistedVar,
            behavior: 'Hoisted and initialized to undefined',
        };
    }
    findings.push({
        concept: 'var hoisting',
        description: 'Variables declared with var are hoisted and initialized to undefined',
        result: testVarHoisting(),
    });

    // Test 2: Temporal Dead Zone (TDZ) demonstration with let / const
    function testTDZBehavior() {
        let errorCaught = null;
        try {
            // Accessing let/const in TDZ throws ReferenceError
            const probe = () => {
                // @ts-ignore
                return tdzVariable;
                // eslint-disable-next-line no-unreachable
                let tdzVariable = 'Declared after';
            };
            probe();
        } catch (err) {
            errorCaught = {
                name: err.name,
                message: err.message,
            };
        }
        return {
            concept: 'Temporal Dead Zone (TDZ)',
            description: 'let and const exist in TDZ from scope entry until declaration line',
            referenceErrorThrown: errorCaught !== null,
            errorDetails: errorCaught,
        };
    }
    findings.push(testTDZBehavior());

    // Test 3: Function Declaration vs Function Expression Hoisting
    function testFunctionHoisting() {
        let declarationWorked = false;
        let expressionTypeError = null;

        // Function Declaration works when called early
        try {
            declarationWorked = typeof hoistedHelperDeclaration === 'function' && hoistedHelperDeclaration() === 'declaration';
        } catch (_e) {
            declarationWorked = false;
        }

        // Function Expression with var throws TypeError when called early
        var exprBefore = typeof hoistedHelperExpr; // 'undefined'
        try {
            // @ts-ignore
            hoistedHelperExpr();
        } catch (e) {
            expressionTypeError = { name: e.name, message: e.message };
        }

        function hoistedHelperDeclaration() {
            return 'declaration';
        }

        // eslint-disable-next-line no-var
        var hoistedHelperExpr = function () {
            return 'expression';
        };

        return {
            concept: 'Declaration vs Expression Hoisting',
            declarationAvailableBeforeDefinition: declarationWorked,
            expressionStateBeforeAssignment: exprBefore,
            expressionCallError: expressionTypeError,
        };
    }
    findings.push({
        concept: 'Function Declaration vs Expression',
        description: 'Function declarations are hoisted with their body; function expressions only hoist the variable identifier',
        result: testFunctionHoisting(),
    });

    // Test 4: Class Hoisting (Classes are in TDZ)
    function testClassHoisting() {
        let classError = null;
        try {
            const probe = () => {
                // @ts-ignore
                new HoistedTestClass();
                // eslint-disable-next-line no-unreachable
                class HoistedTestClass {}
            };
            probe();
        } catch (err) {
            classError = { name: err.name, message: err.message };
        }
        return {
            concept: 'Class Declaration Hoisting',
            description: 'Classes are NOT initialized upon hoisting and remain in TDZ',
            isTDZActive: classError !== null,
            error: classError,
        };
    }
    findings.push(testClassHoisting());

    return findings;
}

// ─── 3. Execution Context Simulator (Creation vs Execution Phase) ────────────

/**
 * Simulates JavaScript Execution Context Creation Phase (Hoisting) and Execution Phase.
 *
 * @param {Array<{type: 'var'|'let'|'const'|'function', name: string, value: any}>} statements
 * @returns {Object} Step-by-step Environment Record and Variable Object state
 */
export function simulateExecutionContextHoisting(statements = [
    { type: 'var', name: 'rescuerName', value: 'Alex Morgan' },
    { type: 'function', name: 'dispatchTeam', value: '[Function: dispatchTeam]' },
    { type: 'let', name: 'activeEmergency', value: 'Severe Injury in Sector 4' },
    { type: 'const', name: 'MAX_CAPACITY', value: 10 },
]) {
    const environmentRecord = {};
    const executionLogs = [];

    // PHASE 1: Creation Phase (Hoisting)
    executionLogs.push('=== PHASE 1: CREATION PHASE (HOISTING) ===');
    for (const stmt of statements) {
        if (stmt.type === 'function') {
            environmentRecord[stmt.name] = {
                type: 'function',
                status: 'INITIALIZED',
                value: stmt.value,
                hoisted: true,
            };
            executionLogs.push(`[Creation] Function '${stmt.name}' hoisted with definition.`);
        } else if (stmt.type === 'var') {
            environmentRecord[stmt.name] = {
                type: 'var',
                status: 'INITIALIZED_UNDEFINED',
                value: undefined,
                hoisted: true,
            };
            executionLogs.push(`[Creation] Var '${stmt.name}' hoisted and initialized to undefined.`);
        } else if (stmt.type === 'let' || stmt.type === 'const') {
            environmentRecord[stmt.name] = {
                type: stmt.type,
                status: 'UNINITIALIZED (TDZ)',
                value: '<TEMPORAL_DEAD_ZONE>',
                hoisted: true,
            };
            executionLogs.push(`[Creation] ${stmt.type} '${stmt.name}' hoisted into Temporal Dead Zone (TDZ).`);
        }
    }

    // PHASE 2: Execution Phase
    executionLogs.push('=== PHASE 2: EXECUTION PHASE (EVALUATION) ===');
    const runtimeScope = { ...environmentRecord };
    for (const stmt of statements) {
        if (stmt.type === 'function') {
            executionLogs.push(`[Execution] Function '${stmt.name}' was already ready.`);
        } else {
            runtimeScope[stmt.name] = {
                ...runtimeScope[stmt.name],
                status: 'ASSIGNED',
                value: stmt.value,
            };
            executionLogs.push(`[Execution] ${stmt.type} '${stmt.name}' assigned value: ${JSON.stringify(stmt.value)}`);
        }
    }

    return {
        creationEnvironment: environmentRecord,
        runtimeScope,
        executionLogs,
    };
}

// ─── 4. Hoisted Function Declarations (Definitions Hoisted to Top) ─────────────
// These functions are declared here at the bottom of the module,
// but are callable at any point in the module due to JS Function Hoisting.

/**
 * Calculates numeric priority based on animal report severity and type.
 * (Hoisted Function Declaration)
 */
function calculateRescuePriority(severity, animalType) {
    const severityWeights = {
        CRITICAL: 100,
        HIGH: 75,
        MEDIUM: 50,
        LOW: 25,
    };

    const baseScore = severityWeights[String(severity).toUpperCase()] || 30;
    const typeModifier = (animalType && /dog|cat|puppy|kitten/i.test(animalType)) ? 10 : 5;

    return Math.min(100, baseScore + typeModifier);
}

/**
 * Converts priority score into a human-readable urgency label.
 * (Hoisted Function Declaration)
 */
function getUrgencyLabel(score) {
    if (score >= 90) return 'Immediate Response Required';
    if (score >= 70) return 'Urgent Attention Needed';
    if (score >= 40) return 'Standard Priority';
    return 'Low Priority Monitoring';
}

/**
 * Estimates response ETA in minutes based on severity and score.
 * (Hoisted Function Declaration)
 */
function estimateResponseTime(severity, score) {
    if (score >= 90) return 10;
    if (score >= 70) return 25;
    if (score >= 40) return 60;
    return 120;
}

/**
 * Formats a comprehensive rescue report summary string.
 * (Hoisted Function Declaration)
 */
function formatRescueSummary(report, score, urgency) {
    const animal = report.animalType || 'Unknown Animal';
    const loc = report.location ? `at [${report.location.coordinates || report.location}]` : 'at specified location';
    return `[${urgency}] (${score} pts) - Rescue for ${animal} ${loc}. Status: ${report.status || 'PENDING'}`;
}

export {
    calculateRescuePriority,
    getUrgencyLabel,
    estimateResponseTime,
    formatRescueSummary,
};
