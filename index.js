const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 8000;
const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

// Connect to the second Redis instance on port 6380
const redisimg = new Redis({
  host: 'localhost',
  port: 6379,
});

app.use(express.json({limit: '2000mb'}));
app.use(express.urlencoded({extended: true, limit:'2000mb'}));
app.use(bodyParser.json());
app.use(cors())

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 4 * 1024} });


function savepost(id,post)
{    try 
    {
      redis.set(id,JSON.stringify(post));
    } 
    catch (err) 
    {
      console.error('Database error', err);
    }
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
  const ids = uuidv4();
  savepost(ids,req.body);
  res.json({msg : "post saved successfully"});
});

app.post('/upload', upload.single('image'), async(req, res) => {
  const imageBuffer = req.file.buffer;
  let imgid = uuidv4();
  imgid = "img" + imgid;
  await redisimg.set(imgid,imageBuffer);
  console.log("image stored successfully");
  console.log(typeof req.file.buffer)
  res.json({ 
    message: 'Image uploaded successfully',
    name: imgid
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
  
  try{
    const temp = await redis.get(req.params.id);
    let value = JSON.parse(temp);
    value.id = req.params.id;
    res.json({data : value});
  }
  catch{
    res.json({msg : "Internal Server Error"});
  }
})

app.get('/getAllDataByCategory/:cat', async (req, res) => {
  try{
    console.log(req.params.cat);
    const keys = await redis.keys('*');
    console.log(keys);

    const keys2 = await redisimg.keys('*');
    console.log(keys2);
    // Fetch values for each key
    let data = []
    for(key of keys)
    {
      console.log(key);
      console.log(key.substring(0,3));
      if(key.substring(0,3)=="img")
      continue;

      const temp = await redis.get(key);
      const value = JSON.parse(temp);
      console.log(value.category);
      console.log(req.params.cat);
      if(value.category === req.params.cat)
      {
        value.id = key;
        data.push(value);
      }
    }

    // Log or use the data as needed
    console.log('All data:', data);
    res.json({data : data});
  }
  catch(err)
  {
    res.json({msg : "internal server error"});
  }
})

app.get('/getAllData', async (req, res) => {
  try{
    const keys = await redis.keys('*');
    console.log(keys);

    const keys2 = await redisimg.keys('*');
    console.log(keys2);
    // Fetch values for each key
    let data = []
    for(key of keys)
    {
      console.log(key);
      console.log(key.substring(0,3));
      if(key.substring(0,3)=="img")
      continue;

      const temp = await redis.get(key);
      const value = JSON.parse(temp);
      value.id = key;
      data.push(value);
    }

    // Log or use the data as needed
    console.log('All data:', data);
    res.json({data : data});
  }
  catch(err){
    res.json({msg : "Internal Server Error"});
  }
})
app.delete('/flushAllData', async (req, res) => {
  try{
    // Flush all keys and values from all databases
  await redis.flushall();
  res.json({msg : "data deleted successfully"});

  }
  catch(err){
    res.json({msg : "Internal Server Error"});
  }
})

app.get('/getImage/:imgname', async(req, res) => {
  const temp = req.params.imgname;
  const imageFile = await redisimg.getBuffer(temp);
  const base64Data = Buffer.from(imageFile).toString('base64');
  res.json({ imageData: `data:image/jpeg;base64,${base64Data}` });
});

// app.get('/getDesc/:filename', (req, res) => {
//   const fetchedDescription = fs.readFileSync(__dirname + '/desc/' + req.params.filename, 'utf-8');
//   res.json({ fileData: fetchedDescription });
// });


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
