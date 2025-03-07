const express = require('express');

const parseBody = express.urlencoded({ extended: true });

module.exports = {parseBody};