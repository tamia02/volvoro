const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'volvoro_super_secret_jwt_key_2026_tour_crm';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const login = async (req, res) => {
  const { loginIdentifier, password, role } = req.body; // Can be email or mobile

  if (!loginIdentifier || !password || !role) {
    return res.status(400).json({ success: false, message: 'Login identifier, password, and role selection are required' });
  }

  try {
    // Find user by email or mobile
    const user = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [
          { email: loginIdentifier },
          { mobile: loginIdentifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(401).json({ success: false, message: 'Selected role does not match this user account' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server login error' });
  }
};

const logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    // Hash and update to new password
    const saltRounds = 12;
    user.password_hash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating password' });
  }
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
};
