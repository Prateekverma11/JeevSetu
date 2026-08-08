const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    
    email: {
        type: String,
        required: true,
        unique: true
    },
    
    password: {
        type: String,
        // Not required if Google Auth
    },
    
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null/undefined values
    },
    
    authProvider: {
        type: String,
        enum: ["LOCAL", "GOOGLE"],
        default: "LOCAL"
    },
    
    phone: String,
    
    role: {
        type: String,
        enum: ["CITIZEN", "RESCUER", "ADMIN"],
        default: "CITIZEN"
    },
    
    profileImage: String,
    
    location: {
        type: {
            type: String,
            enum: ["Point"]
        },
        coordinates: [Number] // [longitude, latitude]
    },
    
    rescueRadius: {
        type: Number,
        min: 1,
        max: 10
    },
    
    isAvailable: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

// Geospatial index for nearby search
userSchema.index({
    location: "2dsphere"
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
