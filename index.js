const express = require('express');
const app = express();


let nameTracker = []


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

app.listen(3000, () => {
    console.log('Go to: http://localhost:3000');
});
