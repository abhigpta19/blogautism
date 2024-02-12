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
const redis = new Redis('rediss://red-cn3u9fv109ks73es4u10:w04WLMS8s0XFFtSiHbxXXABPyLxeIWaW@singapore-redis.render.com:6379');

app.use(express.json({limit: '2000mb'}));
app.use(express.urlencoded({extended: true, limit:'2000mb'}));
app.use(bodyParser.json());
app.use(cors())

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 4 * 1024} });

app.post('/clickCount', async(req, res) => {
  const categoryFile = 'category_data.json';
  // Read the existing JSON file
  const data = await redis.get(req.body.id);
    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);
      existingData.clicks = existingData.clicks + 1;

      await redis.set(req.body.id,JSON.stringify(existingData));
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
    }

  fs.readFile(categoryFile, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error('Error reading the file:', readErr);
      return;
    }
    try {
      // Parse the existing JSON data
      const existingData = JSON.parse(data);
      existingData[0][req.body.category] = existingData[0][req.body.category] + 1;

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
  
    try {
      // Parse the existing JSON data
      const data = await redis.get(req.params.id);
      const existingData = JSON.parse(data);

      // const itemById = existingData.filter(item => item.id === req.params.id);
      // if (itemById[0].clicks > (itemById[0].likes + itemById[0].dislikes)) {
      //   if (req.body.isLiked) {
      //     itemById[0].likes = itemById[0].likes + 1
      //   }
      //   else {
      //     itemById[0].dislikes = itemById[0].dislikes + 1
      //   }
      // }
      // Write the updated data back to the file
      if(req.body.isLiked)
      {
        existingData.likes = existingData.likes + 1;
      }
      else{
        existingData.dislikes = existingData.dislikes +1;
      }
      res.json({msg : "success"});
    } 
    catch (parseErr) 
    {
      res.json({msg : "fail"});
    }
  });

app.post('/createPost', async(req, res) => {
  try{
    console.log("This is the createpost in king");
    console.log("actual" , req.body);
    const ids = await uuidv4();
    const strpost = JSON.stringify(req.body);
    console.log("strigify" , strpost);
    await redis.set(ids,strpost);
    const temp = await redis.get(ids);
    console.log("fetched" , temp);
    res.json({msg : "post saved successfully"});
  }
  catch(err)
  {
    res.json({msg : "server error"});
  }
});

app.post('/upload', upload.single('image'), async(req, res) => {
  const imageBuffer = req.file.buffer;
  let imgid = uuidv4();
  imgid = "img" + imgid;
  await redis.set(imgid,imageBuffer);
  res.json({ 
    message: 'Image uploaded successfully',
    name: imgid
  });
});

app.post('/uploadFile', upload.single('desc'), (req, res) => {
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
    console.log("here I ma");
    const temp = await redis.get(req.params.id);
    console.log(temp.length);
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
    // Fetch values for each key
    let data = []
    for(key of keys)
    {
      if(key.substring(0,3)=="img")
      continue;

      const temp = await redis.get(key);
      const value = JSON.parse(temp);
      if(value.category === req.params.cat)
      {
        value.id = key;
        data.push(value);
        
      }
    }

    // Log or use the data as needed
    res.json({data : data});
  }
  catch(err)
  {
    res.json({msg : "internal server error"});
  }
})

app.get('/getAllData', async (req, res) => {
  try{
    console.log("lets add the all the data");
    const keys = await redis.keys('*');
    // Fetch values for each key
    let data = []
    for(key of keys)
    {
      if(key.substring(0,3) === "img")
      continue;
      
      const temp = await redis.get(key);
      const value = JSON.parse(temp);
      value.id = key;
      console.log(value);
      data.push(value);

      console.log("running");
    }
    console.log("done");

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
  const imageFile = await redis.getBuffer(temp);
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
