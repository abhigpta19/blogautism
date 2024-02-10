const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 8000;

app.use(express.json({limit: '2000mb'}));
app.use(express.urlencoded({extended: true, limit:'2000mb'}));
app.use(bodyParser.json());
app.use(cors())

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 4 * 1024} });

function savepost(post)
{
  const filePath = 'data.json';

  // New JSON object to append
  const newData = post;

  // Read the existing JSON file
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }

    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);

      // Append the new data to the array
      existingData.push(newData);

      // Write the updated data back to the file
      fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to the file:', writeErr);
        } else {
          console.log('Data appended and file updated successfully.');
        }
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }
  });
}

app.post('/clickCount', async(req, res) => {
  const filePath = 'data.json';
  const categoryFile = 'category_data.json';
  // Read the existing JSON file
  console.log("hello world")
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }
    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);

      const itemById = existingData.filter(item => item.id === req.body.id);
    
     itemById[0].clicks = itemById[0].clicks + 1

      // Write the updated data back to the file
      fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to the file:', writeErr);
        } else {
          console.log('Data appended and file updated successfully.');
        }
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }
  });
  fs.readFile(categoryFile, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }
    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);
      existingData[0][req.body.category] = existingData[0][req.body.category] + 1

      // Write the updated data back to the file
      fs.writeFile(categoryFile, JSON.stringify(existingData), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to the file:', writeErr);
        } else {
          console.log('Data appended and file updated successfully.');
        }
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }
  });
  res.json({
    status: 'success'
  })
})

app.post('/likesCount/:id', async(req, res) => {
  const filePath = 'data.json';

  // Read the existing JSON file
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }
    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);

      const itemById = existingData.filter(item => item.id === req.params.id);
      if (itemById[0].clicks > (itemById[0].likes + itemById[0].dislikes)) {
        if (req.body.isLiked) {
          itemById[0].likes = itemById[0].likes + 1
        }
        else {
          itemById[0].dislikes = itemById[0].dislikes + 1
        }
      }
      // Write the updated data back to the file
      fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to the file:', writeErr);
        } else {
          console.log('Data appended and file updated successfully.');
        }
      });
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }
    res.json({
      status: 'success'
    })
  });
})

app.post('/createPost', async(req, res) => {
  console.log("hello ji my name is jassi");
  console.log(req.body);
  req.body.id = uuidv4();
  savepost(req.body);
  res.json({msg : "post saved successfully"});
});

app.post('/upload', upload.single('image'), (req, res) => {
  console.log("majhfjdhfjd");
  const imagePath = `./images/${Date.now()}_${req.file.originalname}`;
  fs.writeFileSync(imagePath, req.file.buffer);
  const name = path.basename(imagePath);
  res.json({ 
    message: 'Image uploaded successfully',
    name: name
  });
});

app.post('/uploadFile', upload.single('desc'), (req, res) => {
  console.log(req.file);
  const path = `./desc/${Date.now()}_description.txt`;
  fs.writeFileSync(path, req.body.desc);
  
  const name = path.basename(path);
  res.json({ 
    message: 'Description uploaded successfully',
    name: name
  });
});

app.get('/getAllDataById/:id', async (req, res) => {
  const filePath = 'data.json';

  // Read the existing JSON file
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }

    const existingData = JSON.parse(data);
    const itemById = existingData.filter(item => item.id === req.params.id);
    // console.log(itemById)
    res.json({
      data: itemById[0]
    })
  });
})

app.get('/getAllDataByCategory/:cat', async (req, res) => {
  const filePath = 'data.json';

  // Read the existing JSON file
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }

    const existingData = JSON.parse(data);
    const itemById = existingData.filter(item => item.category === req.params.cat);
    // console.log(itemById)
    res.json({
      data: itemById
    })
  });
})

app.get('/getAllData', async (req, res) => {
  const filePath = 'data.json';

  // Read the existing JSON file
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }

    const existingData = JSON.parse(data);

    res.json({
      data: existingData
    })
  });
})

app.get('/getImage/:filename', (req, res) => {
  const imageFile = fs.readFileSync(__dirname + '/images/' + req.params.filename);
  const base64Data = Buffer.from(imageFile).toString('base64');
  res.json({ imageData: `data:image/jpeg;base64,${base64Data}` });
});

app.get('/getDesc/:filename', (req, res) => {
  const fetchedDescription = fs.readFileSync(__dirname + '/desc/' + req.params.filename, 'utf-8');
  res.json({ fileData: fetchedDescription });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
