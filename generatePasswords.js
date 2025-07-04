const bcrypt = require('bcrypt');

async function generatePasswords()
{
    console.log('Generating password hashes...\n');

    try
    {
        // Generate hash for admin123
        const adminHash = await bcrypt.hash('admin123', 10);
        console.log('Password: admin123');
        console.log('Hash:', adminHash);

        // Test the hash immediately
        const adminTest = await bcrypt.compare('admin123', adminHash);
        console.log('Test result:', adminTest ? '✅ PASS' : '❌ FAIL');
        console.log('');

        // Generate hash for user123
        const userHash = await bcrypt.hash('user123', 10);
        console.log('Password: user123');
        console.log('Hash:', userHash);

        // Test the hash immediately
        const userTest = await bcrypt.compare('user123', userHash);
        console.log('Test result:', userTest ? '✅ PASS' : '❌ FAIL');
        console.log('');

        // Generate SQL update statements
        console.log('🔧 SQL UPDATE STATEMENTS:');
        console.log('');
        console.log(`UPDATE users SET password = '${ adminHash }' WHERE username = 'admin';`);
        console.log(`UPDATE users SET password = '${ userHash }' WHERE username = 'testuser';`);
        console.log('');

        // Test against the old hash that failed
        console.log('🔍 Testing old hash:');
        const oldHash = '$2b$10$rHFgZx8JGm5wRcYcXYUjzeqVXAYmTG8yW3F8jmKZhHOqcGPQKKp6C';
        const oldTest = await bcrypt.compare('admin123', oldHash);
        console.log('Old hash test:', oldTest ? '✅ PASS' : '❌ FAIL');

    }
    catch (error)
    {
        console.error('Error generating passwords:', error);
    }
}

generatePasswords();