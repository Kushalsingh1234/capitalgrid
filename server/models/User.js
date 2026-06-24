import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Optional for users registering via Google OAuth
    required: false
  },
  googleId: {
    type: String,
    required: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  startupLogo: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    default: null
  },
  startupExists: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hashing middleware for passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper validation checker for password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
