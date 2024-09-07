const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const i18next = require('../middleware/i18n');
const middleware = require('i18next-http-middleware');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const { authenticateJWT } = require('../config/jwt');
const connectToDB = require('../config/db');

connectToDB();

const app = express();
const secretKey = process.env.SECRET_KEY;

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(middleware.handle(i18next));

const priceSchema = new mongoose.Schema({
    courseName: { type: String, required: true },
    coursePrice: { type: Number, required: true },
    courseType: { type: String, required: false },
    image: { type: String, required: true },
    courseTime: { type: String, required: true },
    desc: { type: String, required: true },
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

    app.post('/prices', async (req, res) => {
        try {
            const { courseName, coursePrice, courseType, image, courseTime, desc } = req.body;
            const newPrice = new Price({ courseName, coursePrice, courseType, image, courseTime, desc });
            const savedPrice = await newPrice.save();
            res.json(savedPrice);
        } catch (error) {
            console.error('Price saving error:', error);
            res.status(500).send('Server error');
        }
    });

    app.get('/prices', async (req, res) => {
        try {
            const prices = await Price.find();
            res.json(prices);
        } catch (error) {
            console.error('Price fetching error:', error);
            res.status(500).send('Server error');
        }
    });

    app.put('/prices/:id', async (req, res) => {
        console.log(req.body);

        try {
            const { id } = req.params;
            const { courseName, coursePrice, courseType, courseTime, image, desc } = req.body;

            const updatedData = {
                courseName,
                coursePrice,
                courseType,
                courseTime,
                image,
                desc
            };

            const updatedPrice = await Price.findByIdAndUpdate(id, updatedData, { new: true });

            if (!updatedPrice) {
                return res.status(404).send('Course not found');
            }

            res.json(updatedPrice);
        } catch (error) {
            console.error('Error updating course:', error);
            res.status(500).send('Server error');
        }
    });

    app.delete('/prices/:id', async (req, res) => {
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

    app.get('/prices/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const price = await Price.findById(id);
            if (!price) {
                return res.status(404).send('Price not found');
            }
            res.json(price);
        } catch (error) {
            console.error('Price fetching error:', error);
            res.status(500).send('Server error');
        }
    });

    app.listen(5000, () => {
        console.log('Server running on port 5000');
    });

})();
