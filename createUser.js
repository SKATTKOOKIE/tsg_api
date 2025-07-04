const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Database connection (adjust to match your db.js settings)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'hintonb',
    password: '',
    database: 'tsg_db_v2',
    connectionLimit: 10
});

async function createDefaultUsers()
{
    try
    {
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        console.log('Creating admin user...');
        console.log('Admin password hash:', adminPassword);

        // Delete existing users if they exist
        const deleteQuery = 'DELETE FROM users WHERE username IN (?, ?)';
        pool.query(deleteQuery, ['admin', 'testuser'], (err) =>
        {
            if (err)
            {
                console.log('No existing users to delete or error:', err.message);
            }

            // Insert admin user
            const insertAdminQuery = `
                INSERT INTO users (username, email, password, role, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            `;

            pool.query(insertAdminQuery, ['admin', 'admin@example.com', adminPassword, 'admin'], (err, result) =>
            {
                if (err)
                {
                    console.error('Error creating admin user:', err);
                } else
                {
                    console.log('✅ Admin user created successfully! ID:', result.insertId);
                }

                // Insert test user
                const insertUserQuery = `
                    INSERT INTO users (username, email, password, role, created_at) 
                    VALUES (?, ?, ?, ?, NOW())
                `;

                pool.query(insertUserQuery, ['testuser', 'user@example.com', userPassword, 'user'], (err2, result2) =>
                {
                    if (err2)
                    {
                        console.error('Error creating test user:', err2);
                    } else
                    {
                        console.log('✅ Test user created successfully! ID:', result2.insertId);
                    }

                    // Verify users were created
                    const verifyQuery = 'SELECT id, username, email, role, created_at FROM users';
                    pool.query(verifyQuery, (err3, results) =>
                    {
                        if (err3)
                        {
                            console.error('Error verifying users:', err3);
                        } else
                        {
                            console.log('\n📋 All users in database:');
                            console.table(results);
                        }

                        console.log('\n🔐 Login credentials:');
                        console.log('Admin: username="admin", password="admin123"');
                        console.log('User: username="testuser", password="user123"');

                        process.exit(0);
                    });
                });
            });
        });

    } catch (error)
    {
        console.error('Error creating users:', error);
        process.exit(1);
    }
}

console.log('🚀 Creating default users for Wiki...\n');
createDefaultUsers();