import { generateToken } from '../middleware/auth.js';

// Hardcoded users for now (migrating to DB later)
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'password', // In production, this should be hashed
    email: 'admin@bestreviews.com',
    role: 'admin',
  },
];

export const login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data (without password) and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyToken = (req, res) => {
  // If we got here, token is valid (middleware verified it)
  res.json({
    valid: true,
    user: req.user
  });
};
