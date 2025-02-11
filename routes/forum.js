const express = require('express');
const router = express.Router();
const pool = require('../db');

const FORUM_TABLE = 'forum';

// Get all forum topics
router.get('/', (req, res) =>
{
    const query = `SELECT * FROM ${ FORUM_TABLE }`;
    pool.query(query, (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching forum topics:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Create a new forum topic
router.post('/', (req, res) =>
{
    const { title, description } = req.body;
    if (!title || !description)
    {
        return res.status(400).send({ message: 'Forum addition is formatted incorrectly.' });
    }
    const query = `INSERT INTO ${ FORUM_TABLE } (title, description) VALUES (?, ?)`;
    pool.query(query, [title, description], (err, results) =>
    {
        if (err)
        {
            console.error('Error adding forum topic:', err);
            return res.status(500).send(err);
        }
        res.status(201).send({ id: results.insertId, title, description });
    });
});

module.exports = router;