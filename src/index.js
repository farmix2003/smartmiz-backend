const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const i18next = require('../middleware/i18n');
const middleware = require('i18next-http-middleware');
const cors = require('cors')
const cookieParser = require('cookie-parser');
const connectToDB = require('../config/db')
require('dotenv').config();

const { authorizeAdmin, authenticateJWT } = require('../config/jwt');
const { default: mongoose } = require('mongoose');

connectToDB()

const app = express();
const secretKey = process.env.SECRET_KEY;

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(middleware.handle(i18next));

(async () => {

    const priceSchema = new mongoose.Schema({
        _id: mongoose.SchemaTypes.ObjectId,
        courseName: { type: mongoose.SchemaTypes.String, required: true },
        coursePrice: { type: mongoose.SchemaTypes.Number, required: true },
        courseType: { type: mongoose.SchemaTypes.String, required: false },
        image: { type: mongoose.SchemaTypes.String, required: true },
    })

    const hashedPassword = bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    console.log(`Hashed password: ${hashedPassword}`);

    const users = [
        { id: 1, username: 'admin', password: hashedPassword, role: 'ADMIN' }
    ];

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

            const isPasswordValid = bcrypt.compare(password, user.password);
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
            const newPrice = new priceSchema({ courseName, coursePrice, courseType, image });
            const savedPrice = await newPrice.save();
            res.json(savedPrice);
        } catch (error) {
            console.error('Price saving error:', error);
            res.status(500).send('Server error');
        }
    })
    app.get('/prices', authenticateJWT, async (req, res) => {
        try {
            const prices = await priceSchema.find();
            res.json(prices);
        } catch (error) {
            console.error('Price fetching error:', error);
            res.status(500).send('Server error');
        }
    })
    app.put('/prices/:id', authorizeAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const updatedPrice = await priceSchema.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedPrice) {
                return res.status(404).send('Price not found');
            }
            res.json(updatedPrice);
        } catch (error) {
            console.error('Price update error:', error);
            res.status(500).send('Server error');
        }
    })
    app.delete('/prices/:id', authorizeAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const deletedPrice = await priceSchema.findByIdAndDelete(id);
            if (!deletedPrice) {
                return res.status(404).send('Price not found');
            }
            res.json(deletedPrice);
        } catch (error) {
            console.error('Price deletion error:', error);
            res.status(500).send('Server error');
        }
    })
})
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
