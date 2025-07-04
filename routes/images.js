const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateToken } = require('./auth');

// Configure multer to store in a temp location first
const storage = multer.diskStorage({
    destination: function (req, file, cb)
    {
        // Store in temp directory first
        const tempDir = path.join(__dirname, '..', 'uploads', 'temp');

        if (!fs.existsSync(tempDir))
        {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        cb(null, tempDir);
    },
    filename: function (req, file, cb)
    {
        // Generate unique filename: timestamp-originalname
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const finalName = `${ timestamp }-${ name }${ ext }`;

        cb(null, finalName);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) =>
{
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype))
    {
        cb(null, true);
    } else
    {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload single image
router.post('/upload', authenticateToken, (req, res) =>
{
    // Use multer upload middleware
    upload.single('image')(req, res, function (err)
    {
        if (err)
        {
            console.error('❌ Multer error:', err);
            return res.status(400).json({ message: 'Upload error: ' + err.message });
        }

        try
        {
            if (!req.file)
            {
                console.log('❌ No file in request');
                return res.status(400).json({ message: 'No image file provided' });
            }

            const pageTitle = req.body.pageTitle || 'general';
            console.log('📝 Page title from body:', pageTitle);

            // Clean page title for folder name
            const cleanTitle = pageTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
            console.log('🧹 Clean title:', cleanTitle);

            // Create the target directory
            const targetDir = path.join(__dirname, '..', 'uploads', 'wiki-pages', cleanTitle);
            if (!fs.existsSync(targetDir))
            {
                fs.mkdirSync(targetDir, { recursive: true });
                console.log('✅ Created target directory:', targetDir);
            }

            // Check what's in the temp directory
            const tempPath = req.file.path;
            console.log('📁 Temp file path:', tempPath);
            console.log('📁 Temp file exists:', fs.existsSync(tempPath));

            if (!fs.existsSync(tempPath))
            {
                console.log('❌ Temp file does not exist!');
                return res.status(500).json({ message: 'Temp file not found' });
            }

            // Get file stats
            const tempStats = fs.statSync(tempPath);
            console.log('📊 Temp file stats:', {
                size: tempStats.size,
                created: tempStats.birthtime
            });

            const targetPath = path.join(targetDir, req.file.filename);
            console.log('📁 Target file path:', targetPath);

            // Try to move the file with error handling
            try
            {
                fs.renameSync(tempPath, targetPath);
                console.log('✅ File moved successfully');

                // Verify the file was moved
                if (fs.existsSync(targetPath))
                {
                    console.log('✅ File confirmed in target location');
                    const targetStats = fs.statSync(targetPath);
                    console.log('📊 Target file stats:', {
                        size: targetStats.size,
                        created: targetStats.birthtime
                    });
                } else
                {
                    console.log('❌ File not found in target location after move!');
                    return res.status(500).json({ message: 'File move verification failed' });
                }
            } catch (moveError)
            {
                console.error('❌ File move error:', moveError);

                // Try copying instead of moving
                console.log('🔄 Trying copy instead of move...');
                try
                {
                    fs.copyFileSync(tempPath, targetPath);
                    fs.unlinkSync(tempPath); // Remove temp file
                    console.log('✅ File copied successfully');
                } catch (copyError)
                {
                    console.error('❌ File copy error:', copyError);
                    return res.status(500).json({ message: 'Failed to move or copy file: ' + copyError.message });
                }
            }

            // Create the image URL path
            const imagePath = `/uploads/wiki-pages/${ cleanTitle }/${ req.file.filename }`;
            console.log('🔗 Final image path:', imagePath);

            res.json({
                message: 'Image uploaded successfully',
                imagePath: imagePath,
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                pageFolder: cleanTitle
            });

        } catch (error)
        {
            console.error('❌ Image upload error:', error);

            // Clean up temp file if it exists
            if (req.file && req.file.path && fs.existsSync(req.file.path))
            {
                try
                {
                    fs.unlinkSync(req.file.path);
                    console.log('🧹 Cleaned up temp file');
                } catch (cleanupError)
                {
                    console.error('❌ Error cleaning up temp file:', cleanupError);
                }
            }

            res.status(500).json({ message: 'Error uploading image: ' + error.message });
        }
    });
});

// Debug route to check file system
router.get('/debug/check/:pageFolder/:filename', (req, res) =>
{
    const pageFolder = req.params.pageFolder;
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder, filename);

    console.log('🔍 DEBUG CHECK:');
    console.log('Page folder:', pageFolder);
    console.log('Filename:', filename);
    console.log('Full path:', filepath);
    console.log('File exists:', fs.existsSync(filepath));

    // List all files in the directory
    const dirPath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder);
    console.log('Directory path:', dirPath);
    console.log('Directory exists:', fs.existsSync(dirPath));

    if (fs.existsSync(dirPath))
    {
        const files = fs.readdirSync(dirPath);
        console.log('Files in directory:', files);
    }

    // Also check the uploads root
    const uploadsRoot = path.join(__dirname, '..', 'uploads');
    console.log('Uploads root:', uploadsRoot);
    console.log('Uploads root exists:', fs.existsSync(uploadsRoot));

    if (fs.existsSync(uploadsRoot))
    {
        const rootContents = fs.readdirSync(uploadsRoot);
        console.log('Contents of uploads root:', rootContents);
    }

    res.json({
        pageFolder,
        filename,
        filepath,
        fileExists: fs.existsSync(filepath),
        dirPath,
        dirExists: fs.existsSync(dirPath),
        uploadsRoot,
        uploadsRootExists: fs.existsSync(uploadsRoot)
    });
});

// Test route to check if image exists
router.get('/test/:pageFolder/:filename', (req, res) =>
{
    const pageFolder = req.params.pageFolder;
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder, filename);

    console.log('🔍 Testing image path:', filepath);
    console.log('📁 File exists:', fs.existsSync(filepath));

    if (fs.existsSync(filepath))
    {
        const stats = fs.statSync(filepath);
        console.log('📊 File stats:', {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        });
    }

    // Check if file exists
    if (fs.existsSync(filepath))
    {
        res.sendFile(filepath);
    } else
    {
        res.status(404).json({
            message: 'Image not found',
            searchedPath: filepath,
            exists: false
        });
    }
});

// Direct serve route (bypass static middleware)
router.get('/serve/:pageFolder/:filename', (req, res) =>
{
    const pageFolder = req.params.pageFolder;
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder, filename);

    console.log('🖼️ DIRECT SERVE:');
    console.log('Serving file:', filepath);
    console.log('File exists:', fs.existsSync(filepath));

    if (fs.existsSync(filepath))
    {
        res.sendFile(path.resolve(filepath));
    } else
    {
        res.status(404).json({
            message: 'Image not found',
            searchedPath: filepath,
            exists: false
        });
    }
});

// Get image (serve static files)
router.get('/:pageFolder/:filename', (req, res) =>
{
    const pageFolder = req.params.pageFolder;
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder, filename);

    // Check if file exists
    if (fs.existsSync(filepath))
    {
        res.sendFile(filepath);
    } else
    {
        res.status(404).json({ message: 'Image not found' });
    }
});

// List images for a specific page
router.get('/page/:pageTitle', authenticateToken, (req, res) =>
{
    try
    {
        const pageTitle = req.params.pageTitle;
        const cleanTitle = pageTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const pageDir = path.join(__dirname, '..', 'uploads', 'wiki-pages', cleanTitle);

        if (!fs.existsSync(pageDir))
        {
            return res.json([]);
        }

        const files = fs.readdirSync(pageDir);
        const images = files
            .filter(filename =>
            {
                const ext = path.extname(filename).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            })
            .map(filename =>
            {
                const filepath = path.join(pageDir, filename);
                const stats = fs.statSync(filepath);
                return {
                    filename: filename,
                    imagePath: `/uploads/wiki-pages/${ cleanTitle }/${ filename }`,
                    size: stats.size,
                    uploadDate: stats.birthtime
                };
            });

        res.json(images);
    } catch (error)
    {
        console.error('Error listing page images:', error);
        res.status(500).json({ message: 'Error retrieving images' });
    }
});

// Delete image (admin or uploader only)
router.delete('/:pageFolder/:filename', authenticateToken, (req, res) =>
{
    const pageFolder = req.params.pageFolder;
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'wiki-pages', pageFolder, filename);

    // Basic permission check (you can enhance this)
    if (req.user.role !== 'admin')
    {
        return res.status(403).json({
            message: 'Only admins can delete images'
        });
    }

    // Check if file exists and delete it
    if (fs.existsSync(filepath))
    {
        fs.unlinkSync(filepath);
        res.json({ message: 'Image deleted successfully' });
    } else
    {
        res.status(404).json({ message: 'Image not found' });
    }
});

module.exports = router;