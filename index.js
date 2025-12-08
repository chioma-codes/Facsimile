require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const app = express();


//configuring Cloudinary here
cloudinary.config({ 
    cloud_name: 'dbvcnowa8', 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
 });

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let nameTracker = [];
let galleryPhotos = []; // Store gallery images

app.use(express.static(__dirname));
app.use(express.json());

// route on the server, that is listening to a POST request 
app.post('/name', (req, res) => {
    console.log('test' ,req.body);
    let currentDate = Date();
    let obj= {
        date: currentDate,
        usersName: req.body.name
    }

nameTracker.push(obj);
console.log(nameTracker);
    res.json({ task: req.body });
});

// New route for photo upload - Mix of Claude and the provided CLOUDINARY CODE
app.post('/upload-photo', upload.single('photo'), async (req, res) => {
    try {
        // Get the most recent user's name
        const userName = nameTracker.length > 0 
            ? nameTracker[nameTracker.length - 1].usersName 
            : 'Anonymous';

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
            folder: 'gallery',
            public_id: `${userName}_${Date.now()}`,
        });

        // Store in gallery array
        const photoData = {
            url: uploadResult.secure_url,
            userName: userName,
            uploadDate: new Date().toISOString()
        };
        
        galleryPhotos.push(photoData);

        res.json({ 
            success: true, 
            imageUrl: uploadResult.secure_url,
            userName: userName
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to get all gallery photos
app.get('/gallery-photos', (req, res) => {
    res.json(galleryPhotos);
});



app.listen(3000, () => {
    console.log('Go to: http://localhost:3000');
});
