const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

// Create the Express app
const app = express();
const port = 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const notes_db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'NotesApp'
});

const systems_db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'systems'
});


// Connect to notes database
notes_db.connect((err) =>
{
    if (err)
    {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to Notes Database');
});

// Connect to systems database
systems_db.connect((err) =>
{
    if (err)
    {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to Systems Database');
});

// Routes

// 1. Get all notes
app.get('/notes', (req, res) =>
{
    const query = 'SELECT * FROM notes';
    notes_db.query(query, (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 2. Get a single note by ID
app.get('/notes/:id', (req, res) =>
{
    const query = 'SELECT * FROM notes WHERE id = ?';
    notes_db.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.length === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.json(results[0]);
    });
});

// 3. Create a new note
app.post('/notes', (req, res) =>
{
    const { title, date, note } = req.body;
    if (!title || !date || !note)
    {
        return res.status(400).send({ message: 'Title, date, and note are required' });
    }
    const query = 'INSERT INTO notes (title, date, note) VALUES (?, ?, ?)';
    notes_db.query(query, [title, date, note], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        res.status(201).send({ id: results.insertId, title, date, note });
    });
});

// 4. Update a note by ID
app.put('/notes/:id', (req, res) =>
{
    const { title, date, note } = req.body;
    const query = 'UPDATE notes SET title = ?, date = ?, note = ? WHERE id = ?';
    notes_db.query(query, [title, date, note, req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.send({ message: 'Note updated successfully' });
    });
});

// 5. Delete a note by ID
app.delete('/notes/:id', (req, res) =>
{
    const query = 'DELETE FROM notes WHERE id = ?';
    notes_db.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.send({ message: 'Note deleted successfully' });
    });
});

// 1. Get all system logs
app.get('/system-logs', (req, res) =>
{
    const query = 'SELECT * FROM system_logs';
    systems_db.query(query, (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 2. Get a single system log by ID
app.get('/system-logs/:id', (req, res) =>
{
    const query = 'SELECT * FROM system_logs WHERE id = ?';
    systems_db.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.length === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.json(results[0]);
    });
});

// 3. Create a new system log
app.post('/system-logs', (req, res) =>
{
    const {
        sysNo,
        date,
        partNo,
        worksNo,
        salesNo,
        os,
        winKey,
        SerialNo,
        batchNo,
        rasV,
        carusV,
        rxcomV,
        pcFunc,
        pcMode,
        notes
    } = req.body;

    if (!sysNo || !date || !os || !SerialNo)
    {
        return res.status(400).send({ message: 'sysNo, date, os, and SerialNo are required' });
    }

    const query = `
        INSERT INTO system_logs (sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    systems_db.query(query, [sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        res.status(201).send({ id: results.insertId, ...req.body });
    });
});

// 4. Update a system log by ID
app.put('/system-logs/:id', (req, res) =>
{
    const {
        sysNo,
        date,
        partNo,
        worksNo,
        salesNo,
        os,
        winKey,
        SerialNo,
        batchNo,
        rasV,
        carusV,
        rxcomV,
        pcFunc,
        pcMode,
        notes
    } = req.body;

    const query = `
        UPDATE system_logs 
        SET sysNo = ?, date = ?, partNo = ?, worksNo = ?, salesNo = ?, os = ?, winKey = ?, SerialNo = ?, batchNo = ?, rasV = ?, carusV = ?, rxcomV = ?, pcFunc = ?, pcMode = ?, notes = ?
        WHERE id = ?
    `;
    systems_db.query(query, [sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes, req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.send({ message: 'System log updated successfully' });
    });
});

// 5. Delete a system log by ID
app.delete('/system-logs/:id', (req, res) =>
{
    const query = 'DELETE FROM system_logs WHERE id = ?';
    systems_db.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.send({ message: 'System log deleted successfully' });
    });
});


// Start the server
app.listen(port, () =>
{
    console.log(`Server running on http://localhost:${ port }`);
});


