// Vercel Serverless Function Entry Point
const express = require('express');
const app = require('../backend/server');

// Explicitly export the Express app for Vercel's scanner
module.exports = app;
