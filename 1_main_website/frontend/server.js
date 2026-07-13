const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Define the path to the Vite build directory
const distPath = path.join(__dirname, 'adm-dashboard', 'dist');

// Serve static files from the React app (JS, CSS, images, etc.)
app.use(express.static(distPath));

// SPA fallback: for any route not matched by static files, serve index.html
// This is required for React Router to handle client-side navigation.
// Note: Express v5 requires a handler function instead of the '*' wildcard.
app.use(function (req, res) {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log('================================================');
    console.log(`  ADM Analytics Frontend`);
    console.log(`  Server running at: http://localhost:${PORT}/`);
    console.log(`  Serving from:      adm-dashboard/dist`);
    console.log('================================================');
    console.log('Press Ctrl+C to stop.');
});
