const mongoose = require('mongoose');

const rescueReportSchema = new mongoose.Schema({
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    animalType: {
        type: String,
        required: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    severity: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        required: true
    },
    
    imageUrl: String,
    
    location: {
        type: {
            type: String,
            enum: ["Point"],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    
    status: {
        type: String,
        enum: ["PENDING", "NOTIFIED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        default: "PENDING"
    },
    
    assignedRescuerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    
    acceptedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

rescueReportSchema.index({
    location: "2dsphere"
});

module.exports = mongoose.model('RescueReport', rescueReportSchema);
