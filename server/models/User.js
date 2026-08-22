const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * USER SCHEMA — Animal Rescue Platform
 *
 * NORMALIZATION PRINCIPLES APPLIED (MongoDB adaptation):
 *
 * 1NF (First Normal Form):
 *   - Each field holds a single atomic value (no repeating groups)
 *   - Arrays (location.coordinates) represent a single conceptual unit (GeoJSON Point)
 *   - enum constraints ensure consistent discrete values
 *
 * 2NF (Second Normal Form):
 *   - All non-key fields fully depend on the primary key (_id)
 *   - No partial dependencies — every attribute describes "this user" only
 *
 * 3NF (Third Normal Form):
 *   - No transitive dependencies between non-key fields
 *   - Address info is embedded as a sub-document (UserAddress schema) rather
 *     than storing redundant city/state strings on every related document
 *   - Role-specific fields (rescueRadius, isAvailable) are nullable for citizens,
 *     preventing a separate table from being needed in this document model
 *
 * Relational Equivalent:
 *   In SQL/Prisma this would be: users table + user_addresses table (1:1 FK)
 *   See server/prisma/schema.prisma for the full relational ORM representation.
 */

// ── Address Sub-Document Schema ───────────────────────────────────────────────
// Normalized: Address stored as embedded object rather than flat fields on User.
// In SQL (3NF), this would be a separate `user_addresses` table with a foreign key.
const addressSchema = new mongoose.Schema({
    street: { type: String, trim: true },
    city:   { type: String, trim: true },
    state:  { type: String, trim: true },
    pincode:{ type: String, trim: true },
    country:{ type: String, trim: true, default: 'India' }
}, { _id: false }); // No separate _id — it's part of the User document

// ── Main User Schema ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name must be at most 100 characters']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    
    password: {
        type: String,
        // Not required if Google Auth
        minlength: [6, 'Password must be at least 6 characters']
    },
    
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null/undefined values
    },
    
    authProvider: {
        type: String,
        enum: {
            values: ['LOCAL', 'GOOGLE'],
            message: 'Auth provider must be LOCAL or GOOGLE'
        },
        default: 'LOCAL'
    },
    
    phone: {
        type: String,
        trim: true
    },
    
    role: {
        type: String,
        enum: {
            values: ['CITIZEN', 'RESCUER', 'ADMIN'],
            message: 'Role must be CITIZEN, RESCUER, or ADMIN'
        },
        default: 'CITIZEN'
    },
    
    profileImage: String,
    
    // Normalized address embedded sub-document (1:1 relationship)
    address: {
        type: addressSchema,
        default: null
    },
    
    // GeoJSON Point — used for geospatial queries (rescuers only)
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: [Number] // [longitude, latitude]
    },
    
    // Rescuer-specific fields (null/undefined for citizens — avoids a separate table)
    rescueRadius: {
        type: Number,
        min: [1, 'Rescue radius must be at least 1 km'],
        max: [10, 'Rescue radius cannot exceed 10 km']
    },
    
    isAvailable: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// ── Indexes ───────────────────────────────────────────────────────────────────

// Geospatial index for nearby rescuer search
userSchema.index({ location: '2dsphere' });

// Compound index for common query: find available rescuers of a given role
userSchema.index({ role: 1, isAvailable: 1 });

// ── Pre-Save Hook ─────────────────────────────────────────────────────────────

// Hash password before saving (only when modified)
userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Methods ──────────────────────────────────────────────────────────

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
