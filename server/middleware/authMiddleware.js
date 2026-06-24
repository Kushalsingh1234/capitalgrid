import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token value
      token = req.headers.authorization.split(' ')[1];
      
      // Decrypt token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'capitalgrid-super-secret-jwt-token-key-12345');
      
      // Inject user reference (excluding password hash)
      if (global.useMockDb) {
        req.user = global.mockUsers.find(u => u._id === decoded.id || u.id === decoded.id);
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, player account not found' });
      }
      
      next();
    } catch (error) {
      console.error(`[JWT Error] Authentication parsing failed: ${error.message}`);
      res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no session token provided' });
  }
};

export default protect;
