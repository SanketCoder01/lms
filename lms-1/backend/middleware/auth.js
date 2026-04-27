const jwt = require('jsonwebtoken');

//chech whether user is authentic or not if it is authentic user then it contains token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        console.log(user);
        req.user = user;
       
        next();
    });
};

//check roles (admin,patient)
const allowRoles = (...roles) => {
    return (req, res, next) => {
        console.log("user role",req.user.role);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};


module.exports = { authenticateToken,allowRoles };