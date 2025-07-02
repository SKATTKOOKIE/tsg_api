const express = require('express');
const router = express.Router();
const pool = require('../db');

const NOTES_TABLE = 'brandons_notes';

// Get all notes
router.get('/', (req, res) =>
{
    const query = `SELECT * FROM ${ NOTES_TABLE }`;
    pool.query(query, (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching notes:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Get a single note by ID
router.get('/:id', (req, res) =>
{
    const query = `SELECT * FROM ${ NOTES_TABLE } WHERE id = ?`;
    pool.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching note by ID:', err);
            return res.status(500).send(err);
        }
        if (results.length === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.json(results[0]);
    });
});

// Create a new note
router.post('/', (req, res) =>
{
    const { title, category, date, note } = req.body;
    if (!title || !date || !note || !category)
    {
        return res.status(400).send({ message: 'Title, category date, and note are required' });
    }
    const query = `INSERT INTO ${ NOTES_TABLE } (title, category, date, note) VALUES (?, ?, ?, ?)`;
    pool.query(query, [title, category, date, note], (err, results) =>
    {
        if (err)
        {
            console.error('Error creating note:', err);
            return res.status(500).send(err);
        }
        res.status(201).send({ id: results.insertId, title, date, note });
    });
});

// Update a note by ID
router.put('/:id', (req, res) =>
{
    const { title, category, date, note } = req.body;
    const query = `UPDATE ${ NOTES_TABLE } SET title = ?, category = ?, date = ?, note = ? WHERE id = ?`;
    pool.query(query, [title, category, date, note, req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error updating note:', err);
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.send({ message: 'Note updated successfully' });
    });
});

// Delete a note by ID
router.delete('/:id', (req, res) =>
{
    const query = `DELETE FROM ${ NOTES_TABLE } WHERE id = ?`;
    pool.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error deleting note:', err);
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'Note not found' });
        }
        res.send({ message: 'Note deleted successfully' });
    });
});

module.exports = router;