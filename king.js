const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path')


const app = express();
const port = 8000;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());



const storage = multer.memoryStorage(); // Store the file in memory, you can customize this based on your needs
const upload = multer({ storage: storage });

// Define a route for uploading images
app.post('/', (req, res) => {
  console.log("hello");
  const response = JSON.stringify(req.body);
  console.log(response);
});

app.post('/upload', upload.single('image'), (req, res) => {

  const imagePath = `./images/${Date.now()}_${req.file.originalname}`;
fs.writeFileSync(imagePath, req.file.buffer);
const name = path.basename(filePath);
res.json({ 
  message: 'Image uploaded successfully',
  name: name
});
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
