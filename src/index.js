const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const i18next = require('../middleware/i18n');
const middleware = require('i18next-http-middleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const { authorizeAdmin, authenticateJWT } = require('../config/jwt');
const connectToDB = require('../config/db');

connectToDB();

const app = express();
const secretKey = process.env.SECRET_KEY;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(middleware.handle(i18next));

// Define the schema
const priceSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    coursePrice: { type: Number, required: true },
    courseType: { type: String, required: false },
    image: { type: String, required: true },
});

// Create the model
const Price = mongoose.model('Price', priceSchema);

// IIFE to handle async operations
(async () => {

    // Hashing the admin password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    console.log(`Hashed password: ${hashedPassword}`);

    const users = [
        { id: 1, username: 'admin', password: hashedPassword, role: 'ADMIN' }
    ];

    // Define routes
    app.get("", (req, res) => {
        res.send('Hello World!');
    });

    app.get('/home', (req, res) => {
        console.log('Language:', req.language);
        console.log('Translations:', req.i18n.store.data);
        res.send(req.t('home'));
    });

    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = users.find(u => u.username === username);
            if (!user) {
                return res.status(401).send('Invalid credentials');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).send('Invalid credentials');
            }

            const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).send('Server error');
        }
    });

    app.post('/prices', authorizeAdmin, async (req, res) => {
        try {
            const { courseName, coursePrice, courseType, image } = req.body;
            const newPrice = new Price({ courseName, coursePrice, courseType, image });
            const savedPrice = await newPrice.save();
            res.json(savedPrice);
        } catch (error) {
            console.error('Price saving error:', error);
            res.status(500).send('Server error');
        }
    });

    app.get('/prices', authenticateJWT, async (req, res) => {
        try {
            const prices = await Price.find();
            res.json(prices);
        } catch (error) {
            console.error('Price fetching error:', error);
            res.status(500).send('Server error');
        }
    });

    app.put('/prices/:id', authorizeAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const updatedPrice = await Price.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedPrice) {
                return res.status(404).send('Price not found');
            }
            res.json(updatedPrice);
        } catch (error) {
            console.error('Price update error:', error);
            res.status(500).send('Server error');
        }
    });

    app.delete('/prices/:id', authorizeAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const deletedPrice = await Price.findByIdAndDelete(id);
            if (!deletedPrice) {
                return res.status(404).send('Price not found');
            }
            res.json(deletedPrice);
        } catch (error) {
            console.error('Price deletion error:', error);
            res.status(500).send('Server error');
        }
    });

    // Start the server after the IIFE
    app.listen(5000, () => {
        console.log('Server running on port 5000');
    });

})();
