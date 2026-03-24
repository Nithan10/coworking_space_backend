const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user payload to request object
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized. Token is invalid or expired.' });
  }
};

module.exports = verifyToken;