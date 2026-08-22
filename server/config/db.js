const mongoose = require('mongoose');

/**
 * DATABASE CONNECTION AND ODM vs ORM EXPLANATION
 * 
 * This application uses Mongoose as an ODM (Object Document Mapper) for MongoDB.
 * 
 * Difference between ODM (Mongoose) and ORM (Prisma/Sequelize):
 * - Mongoose (ODM): Maps object models to semi-structured JSON-like documents (MongoDB).
 *   It allows schema-less flexibility but provides validation, casting, and query building.
 * - Prisma/Sequelize (ORM): Maps object models to strict relational tables (PostgreSQL, MySQL).
 *   Requires migrations for changes in schema, defines tables, columns, and foreign keys.
 * 
 * Demonstration of ORM pattern:
 * We have created a Prisma schema file at `server/prisma/schema.prisma` mapping
 * our models (User, RescueReport, etc.) to SQL tables showing the equivalence
 * of MongoDB schemas in a traditional relational database ORM model.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // These options are no longer necessary in Mongoose 6+, but keeping them for backward compatibility if older version is installed.
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
