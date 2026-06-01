const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { role: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where: filter,
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users list' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetUserById error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving user details' });
  }
};

const createUser = async (req, res) => {
  const {
    name,
    mobile,
    email,
    password,
    role,
    joining_date,
    address,
    payout_type,
    salary_amount,
    commission_percentage
  } = req.body;

  if (!name || !mobile || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, mobile, password, and role are required' });
  }

  try {
    // Check if mobile or email is duplicate
    const existingMobile = await User.findOne({ where: { mobile } });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is already registered' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      mobile,
      email: email || null,
      password_hash: passwordHash,
      role,
      status: 'active',
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      created_by: req.user.id,
      address: address || null,
      payout_type: payout_type || 'Salary',
      salary_amount: salary_amount || null,
      commission_percentage: commission_percentage || null,
    });

    // Strip password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password_hash;

    // Log action
    await logActivity({
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      newValue: { name, email, mobile, role },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.status(201).json({ success: true, message: 'User created successfully', data: userResponse });
  } catch (error) {
    console.error('CreateUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  const {
    name,
    mobile,
    email,
    role,
    joining_date,
    password,
    address,
    payout_type,
    salary_amount,
    commission_percentage
  } = req.body;

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldValues = {
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      joining_date: user.joining_date,
      address: user.address,
      payout_type: user.payout_type,
      salary_amount: user.salary_amount,
      commission_percentage: user.commission_percentage,
    };

    // Check unique constraints if mobile or email changed
    if (mobile && mobile !== user.mobile) {
      const existingMobile = await User.findOne({ where: { mobile } });
      if (existingMobile) {
        return res.status(400).json({ success: false, message: 'Mobile number is already registered' });
      }
      user.mobile = mobile;
    }

    if (email !== undefined) {
      const targetEmail = email || null;
      if (targetEmail && targetEmail !== user.email) {
        const existingEmail = await User.findOne({ where: { email: targetEmail } });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email is already registered' });
        }
      }
      user.email = targetEmail;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (joining_date) user.joining_date = joining_date;
    if (address !== undefined) user.address = address;
    if (payout_type !== undefined) user.payout_type = payout_type;
    if (salary_amount !== undefined) user.salary_amount = salary_amount;
    if (commission_percentage !== undefined) user.commission_percentage = commission_percentage;

    if (password) {
      const saltRounds = 12;
      user.password_hash = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    // Log action
    await logActivity({
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      oldValue: oldValues,
      newValue: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        joining_date: user.joining_date,
        address: user.address,
        payout_type: user.payout_type,
        salary_amount: user.salary_amount,
        commission_percentage: user.commission_percentage
      },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'User updated successfully', data: userResponse });
  } catch (error) {
    console.error('UpdateUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user' });
  }
};

const toggleUserStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status is required ("active" or "inactive")' });
  }

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deactivating own account
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own profile' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log action
    await logActivity({
      action: 'USER_STATUS_TOGGLED',
      entityType: 'User',
      entityId: user.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: `User status changed to ${status}`, data: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('ToggleUserStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error changing user status' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own profile' });
    }

    const oldStatus = user.status;
    user.status = 'inactive';
    await user.save();

    await logActivity({
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: user.id,
      oldValue: { status: oldStatus },
      newValue: { status: 'inactive' },
      performedBy: req.user.id,
      roleAtTime: req.user.role,
    });

    return res.json({ success: true, message: 'Employee profile deleted successfully' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting employee' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
};
