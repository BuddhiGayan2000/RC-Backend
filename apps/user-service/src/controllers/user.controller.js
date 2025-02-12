const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');

exports.signup = async (req, res) => {
  try {
    const { full_name, email, password, role, address, phone } = req.body;

    const validRoles = ["customer", "delivery_person", "admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);

    var isApproved = true;
    if(role === "customer"){
      isApproved = false;
    }

    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword,
      role,
      address: role === 'customer' ? address : null,
      area_id: null,
      phone,
      approved: isApproved,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({
      message: 'User registered successfully. Please log in.',
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        address: newUser.address,
        area_id: newUser.area_id,
        phone: newUser.phone,
        approved: newUser.approved,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }

    if (!user.approved) {
      return res
        .status(403)
        .json({
          message:
            'Your account is pending approval. Please wait for an admin to approve your account.',
        });
    }

    const token = generateToken(user);

    res.json({
      message: 'login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        address: user.address,
        area_id: user.area_id,
        phone: user.phone,
        approved: user.approved,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await User.findByPk(customerId);
    if(!customer){
      return res.status(404).json({ error: "Customer not found" });
    }

    if(customer.role !== "customer"){
      return res.status(400).json({ error: "Only customers require approval"});
    }

    customer.approved = true;
    await customer.save();

    res.json({ message: "Customer approved successfully", customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
}
