require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const app = express();

// Cloudinary Configuration - MUST come after dotenv.config()
cloudinary.config({ 
    cloud_name: 'dbvcnowa8', 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test if config loaded properly
console.log('Cloudinary Config:', {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? 'SET' : 'MISSING',
    api_secret: cloudinary.config().api_secret ? 'SET' : 'MISSING'
});

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let nameTracker = [];
let userAnswers = [];

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

// Route to save user answers
app.post('/save-answers', (req, res) => {
    console.log('Answers received:', req.body);
    
    let currentDate = new Date();
    let obj = {
        date: currentDate,
        userName: req.body.userName,
        answers: req.body.answers
    };
    
    userAnswers.push(obj);
    console.log('User answers saved:', userAnswers);
    
    res.json({ success: true, userName: req.body.userName });
});

// Route to get all user answers
app.get('/user-answers', (req, res) => {
    res.json(userAnswers);
});

// Photo upload route - stores metadata in Cloudinary context
app.post('/upload-photo', upload.single('photo'), async (req, res) => {
    try {
        // Get the most recent user's name
        const userName = nameTracker.length > 0 
            ? nameTracker[nameTracker.length - 1].usersName 
            : 'Anonymous';

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const timestamp = Date.now();

        // Upload to Cloudinary with context metadata
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
            folder: 'gallery',
            public_id: `${userName}_${timestamp}`,
            context: `userName=${userName}|uploadDate=${new Date().toISOString()}`
        });

        console.log('Photo uploaded:', uploadResult.secure_url);

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

// Route to get all gallery photos from Cloudinary
app.get('/gallery-photos', async (req, res) => {
    try {
        // Fetch all images from the 'gallery' folder in Cloudinary
        // Using direction: 'desc' to get newest uploads first
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'gallery/',
            max_results: 500,
            context: true,
            direction: 'desc'
        });

        // Transform Cloudinary response into gallery format
        const photos = result.resources.map(resource => {
            // Extract userName from context or public_id
            let userName = 'Anonymous';
            let uploadDate = resource.created_at;

            if (resource.context && resource.context.custom) {
                userName = resource.context.custom.userName || userName;
                uploadDate = resource.context.custom.uploadDate || uploadDate;
            } else {
                // Try to extract from public_id (format: gallery/userName_timestamp)
                const publicIdParts = resource.public_id.split('/');
                const filename = publicIdParts[publicIdParts.length - 1];
                const namePart = filename.split('_')[0];
                if (namePart) {
                    userName = namePart;
                }
            }

            return {
                url: resource.secure_url,
                userName: userName,
                uploadDate: uploadDate
            };
        });

        // Sort photos by uploadDate in descending order (most recent first)
        photos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        console.log(`Fetched ${photos.length} photos from Cloudinary`);
        res.json(photos);

    } catch (error) {
        console.error('Error fetching gallery photos:', error);
        res.status(500).json({ error: 'Failed to fetch gallery photos' });
    }
});

// --------------------
// Start the server with Render-compatible PORT
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});