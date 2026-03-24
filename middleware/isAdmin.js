const isAdmin = (req, res, next) => {
  // verifyToken middleware must run before this to populate req.user
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

module.exports = isAdmin;