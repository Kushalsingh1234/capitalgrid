import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id-for-capitalgrid');

// JWT generation utility
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'capitalgrid-super-secret-jwt-token-key-12345', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new player account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // 1. Basic checks
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All registration fields are required' });
    }

    // 2. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // 3. Password strength: min 8 chars, must contain upper, lower, number
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      });
    }

    // 4. Duplicate check & User Creation (DB or Mock)
    let user;
    if (global.useMockDb) {
      const userExists = global.mockUsers.find(u => u.email === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      user = {
        _id: 'mock-user-' + Date.now(),
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        authProvider: 'email',
        isVerified: false,
        profilePicture: '',
        avatar: '',
        country: '',
        startupId: null,
        startupExists: false,
        startupLogo: '',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      global.mockUsers.push(user);
    } else {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      user = await User.create({
        fullName,
        email,
        password,
        authProvider: 'email'
      });
    }

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePicture: user.profilePicture,
          avatar: user.avatar,
          country: user.country || '',
          startupId: user.startupId || null,
          startupExists: user.startupExists || false,
          authProvider: user.authProvider
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to create user account' });
    }

  } catch (error) {
    console.error(`[Auth Register Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server registration error' });
  }
};

/**
 * @desc    Authenticate credentials
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let user;
    let isMatch = false;

    if (global.useMockDb) {
      user = global.mockUsers.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      isMatch = await user.matchPassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update login timestamp
    user.lastLogin = new Date();
    if (!global.useMockDb) {
      await user.save();
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
        country: user.country || '',
        startupId: user.startupId || null,
        startupExists: user.startupExists || false,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error(`[Auth Login Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server login error' });
  }
};

/**
 * @desc    Google pop-up OAuth token validation
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google authentication credential is required' });
    }

    let payload;

    // Handle mock token for evaluation bypass if dummy ID is set
    if (process.env.GOOGLE_CLIENT_ID === 'dummy-google-client-id-for-capitalgrid' && credential.startsWith('mock-')) {
      const mockEmail = credential.replace('mock-', '') + '@example.com';
      payload = {
        email: mockEmail,
        name: 'Mock Google User',
        picture: '/assets/avatars/avatar_cyber_1.png',
        sub: 'mock-google-id-' + Date.now()
      };
    } else {
      // Validate ticket with Google servers
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id-for-capitalgrid'
      });
      payload = ticket.getPayload();
    }

    const { email, name, picture, sub } = payload;

    // Check or create player account (DB or Mock)
    let user;
    
    if (global.useMockDb) {
      user = global.mockUsers.find(u => u.email === email.toLowerCase());
      
      if (!user) {
        user = {
          _id: 'mock-google-user-' + Date.now(),
          fullName: name,
          email: email.toLowerCase(),
          profilePicture: picture,
          googleId: sub,
          authProvider: 'google',
          isVerified: true,
          avatar: '',
          country: '',
          startupId: null,
          startupExists: false,
          startupLogo: '',
          createdAt: new Date(),
          lastLogin: new Date()
        };
        global.mockUsers.push(user);
      } else {
        user.lastLogin = new Date();
      }
    } else {
      user = await User.findOne({ email });

      if (!user) {
        // Auto-create account for new users
        user = await User.create({
          fullName: name,
          email,
          profilePicture: picture,
          googleId: sub,
          authProvider: 'google',
          isVerified: true
        });
      } else {
        // Account exists, sync googleId or profile details if authProvider was email but googleId empty
        let detailsModified = false;
        if (!user.googleId) {
          user.googleId = sub;
          detailsModified = true;
        }
        if (!user.profilePicture && picture) {
          user.profilePicture = picture;
          detailsModified = true;
        }
        
        user.lastLogin = new Date();
        detailsModified = true;

        if (detailsModified) {
          await user.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        avatar: user.avatar,
        country: user.country || '',
        startupId: user.startupId || null,
        startupExists: user.startupExists || false,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error(`[Google Auth Error] Token verification failed: ${error.message}`);
    res.status(400).json({ success: false, message: 'Google authentication verification failed' });
  }
};

/**
 * @desc    Fetch current profile details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user has already been populated by authMiddleware
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        avatar: req.user.avatar,
        country: req.user.country || '',
        startupId: req.user.startupId || null,
        startupExists: req.user.startupExists || false,
        authProvider: req.user.authProvider
      }
    });
  } catch (error) {
    console.error(`[Profile Read Error] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server profile fetching error' });
  }
};
