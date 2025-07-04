const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import routes
const notesRoutes = require('./routes/notes');
const forumRoutes = require('./routes/forum');
const systemLogsRoutes = require('./routes/system-logs');
const brandonsNotesRoutes = require('./routes/brandons_notes');
const bobbysNotesRoutes = require('./routes/bobbys_notes');
const authRoutes = require('./routes/auth'); // New auth routes
const wikiRoutes = require('./routes/wiki'); // Updated wiki routes

// Create the Express app
const app = express();
const port = 3003;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:7777'  // Add your frontend port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Route middleware
app.use('/auth', authRoutes); // Authentication routes
app.use('/notes', notesRoutes);
app.use('/brandons_notes', brandonsNotesRoutes);
app.use('/bobbys_notes', bobbysNotesRoutes);
app.use('/forum', forumRoutes);
app.use('/system-logs', systemLogsRoutes);
app.use('/wiki', wikiRoutes); // Protected wiki routes

// Health check endpoint
app.get('/health', (req, res) =>
{
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Server is running'
    });
});

// Start the server
app.listen(port, () =>
{
    console.log(`Server running on http://localhost:${ port }`);
    console.log('Available endpoints:');
    console.log('- POST /auth/register - Register new user');
    console.log('- POST /auth/login - Login user');
    console.log('- GET /auth/me - Get current user info');
    console.log('- GET /wiki - Get all wiki pages (authenticated)');
    console.log('- POST /wiki - Create wiki page (authenticated)');
    console.log('- PUT /wiki/:id - Edit wiki page (admin or creator)');
    console.log('- DELETE /wiki/:id - Delete wiki page (admin or creator)');
});