const express = require('express');
const router = express.Router();
const pool = require('../db');

const SYSTEMS_TABLE = 'system_logs';

// Get all system logs
router.get('/', (req, res) =>
{
    const query = `SELECT * FROM ${ SYSTEMS_TABLE }`;
    pool.query(query, (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching system logs:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Get a single system log by ID
router.get('/:id', (req, res) =>
{
    const query = `SELECT * FROM ${ SYSTEMS_TABLE } WHERE id = ?`;
    pool.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error fetching system log by ID:', err);
            return res.status(500).send(err);
        }
        if (results.length === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.json(results[0]);
    });
});

// Create a new system log
router.post('/', (req, res) =>
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
        INSERT INTO ${ SYSTEMS_TABLE } 
        (sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo, batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    pool.query(query, [
        sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo,
        batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes
    ], (err, results) =>
    {
        if (err)
        {
            console.error('Error creating system log:', err);
            return res.status(500).send(err);
        }
        res.status(201).send({ id: results.insertId, ...req.body });
    });
});

// Update a system log by ID
router.put('/:id', (req, res) =>
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
        SET sysNo = ?, date = ?, partNo = ?, worksNo = ?, salesNo = ?, os = ?, 
        winKey = ?, SerialNo = ?, batchNo = ?, rasV = ?, carusV = ?, rxcomV = ?, 
        pcFunc = ?, pcMode = ?, notes = ?
        WHERE id = ?
    `;
    pool.query(query, [
        sysNo, date, partNo, worksNo, salesNo, os, winKey, SerialNo,
        batchNo, rasV, carusV, rxcomV, pcFunc, pcMode, notes, req.params.id
    ], (err, results) =>
    {
        if (err)
        {
            console.error('Error updating system log:', err);
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.send({ message: 'System log updated successfully' });
    });
});

// Delete a system log by ID
router.delete('/:id', (req, res) =>
{
    const query = `DELETE FROM ${ SYSTEMS_TABLE } WHERE id = ?`;
    pool.query(query, [req.params.id], (err, results) =>
    {
        if (err)
        {
            console.error('Error deleting system log:', err);
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0)
        {
            return res.status(404).send({ message: 'System log not found' });
        }
        res.send({ message: 'System log deleted successfully' });
    });
});

module.exports = router;