const cron = require('node-cron');
const RescueReport = require('../models/RescueReport');
const RescueHistory = require('../models/RescueHistory');

/**
 * CRON JOB 1: Auto-cancel stale PENDING reports
 *
 * Schedule: Every day at midnight (00:00)
 * Logic: Reports that have been in PENDING or NOTIFIED status for more than 48 hours
 *        without being accepted are automatically cancelled to keep the system clean.
 */
const stalePendingReportCleanup = cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running: stale pending report cleanup...');

    try {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

        // Find stale reports
        const staleReports = await RescueReport.find({
            status: { $in: ['PENDING', 'NOTIFIED'] },
            createdAt: { $lt: cutoff }
        });

        if (staleReports.length === 0) {
            console.log('[CRON] No stale reports found.');
            return;
        }

        // Bulk cancel them
        const reportIds = staleReports.map(r => r._id);
        await RescueReport.updateMany(
            { _id: { $in: reportIds } },
            { $set: { status: 'CANCELLED' } }
        );

        // Create history entries for each cancelled report
        const historyEntries = staleReports.map(report => ({
            reportId: report._id,
            changedBy: report.citizenId,
            status: 'CANCELLED',
            notes: 'Auto-cancelled by system: no rescuer accepted within 48 hours'
        }));
        await RescueHistory.insertMany(historyEntries);

        console.log(`[CRON] Auto-cancelled ${staleReports.length} stale report(s).`);
    } catch (error) {
        console.error('[CRON] Error in stale report cleanup:', error.message);
    }
}, {
    scheduled: false, // Start manually via startAllJobs()
    timezone: 'Asia/Kolkata'
});

/**
 * CRON JOB 2: System health stats logger
 *
 * Schedule: Every 30 minutes
 * Logic: Logs a summary of report statuses for monitoring purposes.
 */
const systemHealthLogger = cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running: system health stats...');

    try {
        // Grouped count by status (Filtering + Grouping concept)
        const stats = await RescueReport.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const summary = stats.map(s => `${s._id}: ${s.count}`).join(', ');
        console.log(`[CRON] Report Stats — ${summary || 'No reports yet'}`);
        console.log(`[CRON] Health check complete at ${new Date().toISOString()}`);
    } catch (error) {
        console.error('[CRON] Error in health logger:', error.message);
    }
}, {
    scheduled: false,
    timezone: 'Asia/Kolkata'
});

/**
 * CRON JOB 3: Weekly completed rescue summary
 *
 * Schedule: Every Monday at 9:00 AM
 * Logic: Logs how many rescues were completed in the past week.
 */
const weeklyRescueSummary = cron.schedule('0 9 * * 1', async () => {
    console.log('[CRON] Running: weekly rescue summary...');

    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const completed = await RescueReport.countDocuments({
            status: 'COMPLETED',
            completedAt: { $gte: oneWeekAgo }
        });

        const pending = await RescueReport.countDocuments({
            status: { $in: ['PENDING', 'NOTIFIED'] }
        });

        console.log(`[CRON] Weekly Summary — Completed: ${completed} rescues | Still Pending: ${pending} reports`);
    } catch (error) {
        console.error('[CRON] Error in weekly summary:', error.message);
    }
}, {
    scheduled: false,
    timezone: 'Asia/Kolkata'
});

/**
 * Start all scheduled cron jobs.
 */
const startAllJobs = () => {
    stalePendingReportCleanup.start();
    systemHealthLogger.start();
    weeklyRescueSummary.start();
    console.log('[CRON] All scheduled jobs started.');
    console.log('[CRON] Jobs: stale-cleanup (daily midnight), health-logger (every 30min), weekly-summary (Mon 9AM)');
};

/**
 * Stop all scheduled cron jobs gracefully.
 */
const stopAllJobs = () => {
    stalePendingReportCleanup.stop();
    systemHealthLogger.stop();
    weeklyRescueSummary.stop();
    console.log('[CRON] All scheduled jobs stopped.');
};

module.exports = { startAllJobs, stopAllJobs };
