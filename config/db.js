const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.MONGODB_URI;

const connectToDB = async () => {
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
}
module.exports = connectToDB
