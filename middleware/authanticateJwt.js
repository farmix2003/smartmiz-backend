const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(403).send('Access denied');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Attach decoded token data to req
        next();
    } catch (error) {
        return res.status(401).send('Invalid token');
    }
};
module.exports = authenticateJWT
