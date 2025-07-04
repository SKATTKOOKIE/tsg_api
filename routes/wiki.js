const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

const WIKI_TABLE = 'wiki_pages';

// Get all wiki pages (requires authentication)
router.get('/', authenticateToken, (req, res) =>
{
    const query = `
        SELECT wp.*, u.username as author_name 
        FROM ${ WIKI_TABLE } wp 
        LEFT JOIN users u ON wp.author_id = u.id 
        ORDER BY wp.created_at DESC
    `;

    pool.query(query, (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching wiki pages:', err);
            return res.status(500).send(err);
        }

        // Parse the content JSON for each page
        const pages = results.map(page => ({
            ...page,
            content: JSON.parse(page.content),
            author: page.author_name || page.author // fallback to old author field
        }));

        res.json(pages);
    });
});

// Get a single wiki page by ID (requires authentication)
router.get('/:id', authenticateToken, (req, res) =>
{
    const query = `
        SELECT wp.*, u.username as author_name 
        FROM ${ WIKI_TABLE } wp 
        LEFT JOIN users u ON wp.author_id = u.id 
        WHERE wp.id = ?
    `;

    pool.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching wiki page by ID:', err);
            return res.status(500).send(err);
        }
        if (results.length === 0)
        {
            return res.status(404).send({ message: 'Wiki page not found' });
        }

        const page = {
            ...results[0],
            content: JSON.parse(results[0].content),
            author: results[0].author_name || results[0].author
        };

        res.json(page);
    });
});

// Create a new wiki page (requires authentication - any logged in user)
router.post('/', authenticateToken, (req, res) =>
{
    const { title, content } = req.body;

    if (!title || !content)
    {
        return res.status(400).send({
            message: 'Title and content are required'
        });
    }

    const contentJson = JSON.stringify(content);
    const authorId = req.user.userId;
    const authorName = req.user.username;

    const query = `
        INSERT INTO ${ WIKI_TABLE } (title, author_id, author, content, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    pool.query(query, [title, authorId, authorName, contentJson], (err, results) =>
    {
        if (err)
        {
            console.error('Error creating wiki page:', err);
            return res.status(500).send(err);
        }
        res.status(201).send({
            id: results.insertId,
            title,
            author: authorName,
            content,
            message: 'Wiki page created successfully'
        });
    });
});

// Update a wiki page by ID (admin only OR page creator)
router.put('/:id', authenticateToken, async (req, res) =>
{
    const { title, content } = req.body;
    const pageId = req.params.id;

    if (!title || !content)
    {
        return res.status(400).send({
            message: 'Title and content are required'
        });
    }

    // Check if user is admin or the creator of the page
    const checkOwnershipQuery = `SELECT author_id FROM ${ WIKI_TABLE } WHERE id = ?`;

    pool.query(checkOwnershipQuery, [pageId], (checkErr, checkResults) =>
    {
        if (checkErr)
        {
            console.error('Error checking page ownership:', checkErr);
            return res.status(500).send({ message: 'Database error' });
        }

        if (checkResults.length === 0)
        {
            return res.status(404).send({ message: 'Wiki page not found' });
        }

        const pageAuthorId = checkResults[0].author_id;
        const isAdmin = req.user.role === 'admin';
        const isOwner = pageAuthorId === req.user.userId;

        if (!isAdmin && !isOwner)
        {
            return res.status(403).send({
                message: 'You can only edit your own pages or need admin privileges'
            });
        }

        // Proceed with update
        const contentJson = JSON.stringify(content);
        const updateQuery = `
            UPDATE ${ WIKI_TABLE } 
            SET title = ?, content = ?, updated_at = NOW() 
            WHERE id = ?
        `;

        pool.query(updateQuery, [title, contentJson, pageId], (updateErr, updateResults) =>
        {
            if (updateErr)
            {
                console.error('Error updating wiki page:', updateErr);
                return res.status(500).send(updateErr);
            }
            if (updateResults.affectedRows === 0)
            {
                return res.status(404).send({ message: 'Wiki page not found' });
            }
            res.send({ message: 'Wiki page updated successfully' });
        });
    });
});

// Delete a wiki page by ID (admin only OR page creator)
router.delete('/:id', authenticateToken, (req, res) =>
{
    const pageId = req.params.id;

    // Check if user is admin or the creator of the page
    const checkOwnershipQuery = `SELECT author_id FROM ${ WIKI_TABLE } WHERE id = ?`;

    pool.query(checkOwnershipQuery, [pageId], (checkErr, checkResults) =>
    {
        if (checkErr)
        {
            console.error('Error checking page ownership:', checkErr);
            return res.status(500).send({ message: 'Database error' });
        }

        if (checkResults.length === 0)
        {
            return res.status(404).send({ message: 'Wiki page not found' });
        }

        const pageAuthorId = checkResults[0].author_id;
        const isAdmin = req.user.role === 'admin';
        const isOwner = pageAuthorId === req.user.userId;

        if (!isAdmin && !isOwner)
        {
            return res.status(403).send({
                message: 'You can only delete your own pages or need admin privileges'
            });
        }

        // Proceed with deletion
        const deleteQuery = `DELETE FROM ${ WIKI_TABLE } WHERE id = ?`;
        pool.query(deleteQuery, [pageId], (deleteErr, deleteResults) =>
        {
            if (deleteErr)
            {
                console.error('Error deleting wiki page:', deleteErr);
                return res.status(500).send(deleteErr);
            }
            if (deleteResults.affectedRows === 0)
            {
                return res.status(404).send({ message: 'Wiki page not found' });
            }
            res.send({ message: 'Wiki page deleted successfully' });
        });
    });
});

// Search wiki pages by title or content (requires authentication)
router.get('/search/:query', authenticateToken, (req, res) =>
{
    const searchQuery = `%${ req.params.query }%`;
    const query = `
        SELECT wp.*, u.username as author_name 
        FROM ${ WIKI_TABLE } wp 
        LEFT JOIN users u ON wp.author_id = u.id 
        WHERE wp.title LIKE ? OR wp.content LIKE ? 
        ORDER BY wp.created_at DESC
    `;

    pool.query(query, [searchQuery, searchQuery], (err, results) =>
    {
        if (err)
        {
            console.error('Error searching wiki pages:', err);
            return res.status(500).send(err);
        }

        const pages = results.map(page => ({
            ...page,
            content: JSON.parse(page.content),
            author: page.author_name || page.author
        }));

        res.json(pages);
    });
});

// Get user's own pages
router.get('/my/pages', authenticateToken, (req, res) =>
{
    const query = `
        SELECT wp.*, u.username as author_name 
        FROM ${ WIKI_TABLE } wp 
        LEFT JOIN users u ON wp.author_id = u.id 
        WHERE wp.author_id = ? 
        ORDER BY wp.created_at DESC
    `;

    pool.query(query, [req.user.userId], (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching user pages:', err);
            return res.status(500).send(err);
        }

        const pages = results.map(page => ({
            ...page,
            content: JSON.parse(page.content),
            author: page.author_name || page.author
        }));

        res.json(pages);
    });
});

module.exports = router;