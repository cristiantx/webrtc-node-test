const express = require('express');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log('Server started. Press Ctrl+C to quit'));