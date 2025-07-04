const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../db');

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Register new user
router.post('/register', async (req, res) =>
{
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password)
    {
        return res.status(400).json({
            message: 'Username, email, and password are required'
        });
    }

    try
    {
        // Check if user already exists
        const checkUserQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
        pool.query(checkUserQuery, [username, email], async (err, results) =>
        {
            if (err)
            {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0)
            {
                return res.status(400).json({
                    message: 'Username or email already exists'
                });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const insertQuery = `
                INSERT INTO users (username, email, password, role, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            `;

            pool.query(insertQuery, [username, email, hashedPassword, role], (insertErr, insertResults) =>
            {
                if (insertErr)
                {
                    console.error('Error creating user:', insertErr);
                    return res.status(500).json({ message: 'Error creating user' });
                }

                res.status(201).json({
                    message: 'User created successfully',
                    userId: insertResults.insertId
                });
            });
        });
    } catch (error)
    {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
router.post('/login', (req, res) =>
{
    const { username, password } = req.body;

    console.log('🔍 LOGIN ATTEMPT:');
    console.log('Received username:', username);
    console.log('Received password:', password);
    console.log('Request body:', req.body);

    if (!username || !password)
    {
        console.log('❌ Missing username or password');
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    console.log('🔍 Running query:', query);
    console.log('Query params:', [username, username]);

    pool.query(query, [username, username], async (err, results) =>
    {
        if (err)
        {
            console.error('❌ Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        console.log('📊 Database query results:');
        console.log('Number of results:', results.length);
        if (results.length > 0)
        {
            console.log('Found user:', {
                id: results[0].id,
                username: results[0].username,
                email: results[0].email,
                role: results[0].role,
                hasPassword: !!results[0].password,
                passwordLength: results[0].password ? results[0].password.length : 0
            });
        }

        if (results.length === 0)
        {
            console.log('❌ No user found with username/email:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = results[0];

        try
        {
            console.log('🔐 Checking password...');
            console.log('Plain password:', password);
            console.log('Stored hash:', user.password);

            // Check password
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('Password match result:', passwordMatch);

            if (!passwordMatch)
            {
                console.log('❌ Password does not match');
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            console.log('✅ Password match successful!');

            // Create JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login
            const updateLoginQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
            pool.query(updateLoginQuery, [user.id], (updateErr) =>
            {
                if (updateErr)
                {
                    console.error('Error updating last login:', updateErr);
                }
            });

            console.log('✅ Login successful for user:', user.username);

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error)
        {
            console.error('❌ Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});

// Get current user info (requires authentication)
router.get('/me', authenticateToken, (req, res) =>
{
    const query = 'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?';
    pool.query(query, [req.user.userId], (err, results) =>
    {
        if (err)
        {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0)
        {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(results[0]);
    });
});

// Logout (client-side token removal, but we can blacklist tokens if needed)
router.post('/logout', authenticateToken, (req, res) =>
{
    // In a more sophisticated setup, you might want to blacklist the token
    res.json({ message: 'Logout successful' });
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) =>
{
    const query = 'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC';
    pool.query(query, (err, results) =>
    {
        if (err)
        {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

// Update user role (admin only)
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) =>
{
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !['user', 'admin'].includes(role))
    {
        return res.status(400).json({ message: 'Valid role (user/admin) is required' });
    }

    const query = 'UPDATE users SET role = ? WHERE id = ?';
    pool.query(query, [role, userId], (err, results) =>
    {
        if (err)
        {
            console.error('Error updating user role:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.affectedRows === 0)
        {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated successfully' });
    });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next)
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token)
    {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) =>
    {
        if (err)
        {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Middleware to require admin role
function requireAdmin(req, res, next)
{
    if (req.user.role !== 'admin')
    {
        return res.status(403).json({
            message: 'Admin access required'
        });
    }
    next();
}

// Export middleware for use in other routes
module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;