const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Fallback route to serve index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`==================================================`);
    console.log(`🎨 Color Palette Generator Server is running!`);
    console.log(`🌐 Local Access: http://localhost:${port}`);
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`==================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

const START_PORT = process.env.PORT || 3001;
startServer(parseInt(START_PORT));
