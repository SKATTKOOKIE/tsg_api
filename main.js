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
const tsg_database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tsg_db'
});

const NOTES_TABLE = 'brandons_notes';
const SYSTEMS_TABLE = 'system_logs'

// Connect to TSG Database
tsg_database.connect((err) =>
{
    if (err)
    {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to TSG Database');
});


// Routes

// 1. Get all notes
app.get('/notes', (req, res) =>
{
    const query = `SELECT * FROM ${ NOTES_TABLE }`;
    tsg_database.query(query, (err, results) =>
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
    const query = `SELECT * FROM ${ NOTES_TABLE } WHERE id = ?`;
    tsg_database.query(query, [req.params.id], (err, results) =>
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
    const query = `INSERT INTO ${ NOTES_TABLE } (title, date, note) VALUES (?, ?, ?)`;
    tsg_database.query(query, [title, date, note], (err, results) =>
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
    const query = `UPDATE ${ NOTES_TABLE } SET title = ?, date = ?, note = ? WHERE id = ?`;
    tsg_database.query(query, [title, date, note, req.params.id], (err, results) =>
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
    const query = `DELETE FROM ${ NOTES_TABLE } WHERE id = ?`;
    tsg_database.query(query, [req.params.id], (err, results) =>
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
    const query = `SELECT * FROM ${ SYSTEMS_TABLE }`;
    tsg_database.query(query, (err, results) =>
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
    const query = `SELECT * FROM ${ SYSTEMS_TABLE } WHERE id = ?`;
    tsg_database.query(query, [req.params.id], (err, results) =>
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
        INSERT INTO ${ SYSTEMS_TABLE } (sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    tsg_database.query(query, [sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes], (err, results) =>
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
        UPDATE ${ SYSTEMS_TABLE } 
        SET sysNo = ?, date = ?, partNo = ?, worksNo = ?, salesNo = ?, os = ?, winKey = ?, SerialNo = ?, batchNo = ?, rasV = ?, carusV = ?, rxcomV = ?, pcFunc = ?, pcMode = ?, notes = ?
        WHERE id = ?
    `;
    tsg_database.query(query, [sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes, req.params.id], (err, results) =>
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
    const query = `DELETE FROM ${ SYSTEMS_TABLE } WHERE id = ?`;
    tsg_database.query(query, [req.params.id], (err, results) =>
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


