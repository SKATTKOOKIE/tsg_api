const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import routes
const notesRoutes = require('./routes/notes');
const forumRoutes = require('./routes/forum');
const systemLogsRoutes = require('./routes/system-logs');
const brandonsNotesRoutes = require('./routes/brandons_notes');
const bobbysNotesRoutes = require('./routes/bobbys_notes');

// Create the Express app
const app = express();
const port = 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route middleware
app.use('/notes', notesRoutes);
app.use('/brandons_notes', brandonsNotesRoutes);
app.use('/bobbys_notes', bobbysNotesRoutes);
app.use('/forum', forumRoutes);
app.use('/system-logs', systemLogsRoutes);

// Start the server
app.listen(port, () =>
{
    console.log(`Server running on http://localhost:${ port }`);
});