const express = require('express');
const router = express.Router();
const db = require('../db'); // PostgreSQL client from 'pg'

// Haversine distance formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Add school
router.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id';
  try {
    const result = await db.query(sql, [name, address, latitude, longitude]);
    res.status(201).json({ message: 'School added successfully', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// List schools sorted by distance
router.get('/listSchools', async (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ message: 'Invalid latitude or longitude' });
  }

  const sql = 'SELECT * FROM schools';
  try {
    const result = await db.query(sql);
    const schools = result.rows;

    const sortedSchools = schools.map(school => {
      const distance = getDistance(userLat, userLon, school.latitude, school.longitude);
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
