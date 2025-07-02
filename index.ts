import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from qrcodes directory
app.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Validate filename to prevent directory traversal attacks
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }
  
  console.log("Requested image: ", filename);
  // Construct the full path to the image in qrcodes directory
  // Use process.cwd() to get the project root directory instead of __dirname
  const imagePath = path.join(process.cwd(), 'qrcodes', filename);
  console.log("Full image path: ", imagePath);
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    res.status(404).json({ error: 'Image not found' });
    console.error("Image not found: ", filename);
    return;
  }
  
  // Get file stats to check if it's a file
  const stats = fs.statSync(imagePath);
  if (!stats.isFile()) {
    res.status(400).json({ error: 'Not a file' });
    console.error("Not a file: ", filename);
    return;
  }
  
  // Get file extension to determine content type
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  
  // Set appropriate content type based on file extension
  switch (ext) {
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
    default:
      contentType = 'application/octet-stream';
  }
  console.log("Content type: ", contentType);
  // Set headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  // Stream the file to the response
  const fileStream = fs.createReadStream(imagePath);
  fileStream.pipe(res);
  
  // Handle errors
  fileStream.on('error', (error) => {
    console.error('Error reading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
      console.error("Internal server error: ", error);
    }
  });
  console.log("Image sent, status code: ", res.statusCode);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'QR Code Image Server is running',
    usage: 'GET /{filename} to retrieve an image from the qrcodes directory'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server-qr v1.0.0 (01072025-19:48) is running on http://localhost:${PORT}`);
  console.log(`Images are served from the 'qrcodes' directory`);
});

export default app;
