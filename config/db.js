const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable for the connection string with a fallback
        const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SemesterProject';
        await mongoose.connect(dbUri);
        console.log('MongoDB connected ✅');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;