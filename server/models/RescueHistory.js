const mongoose = require('mongoose');

const rescueHistorySchema = new mongoose.Schema({
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RescueReport"
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: String,
    notes: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RescueHistory', rescueHistorySchema);
