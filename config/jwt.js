const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const secretKey = process.env.SECRET_KEY;

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(403).send('Access denied');
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send('Invalid token');
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).send('Access restricted to admins only');
    }
    next();
};

module.exports = {
    authorizeAdmin,
    authenticateJWT
};
