// db.js
const pgp = require('pg-promise')();
const DB_USER = 'postgres';
const DB_PWD = '1234';
const DB_HOST = 'localhost';
const DB_PORT = '5432';
const DB_NAME = 'hw13';

const db = pgp(`postgres://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

module.exports = db;