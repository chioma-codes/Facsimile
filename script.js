const enterBtn = document.getElementById('enterBtn');
const nameBox = document.getElementById('nameBox');
const page2 = document.getElementById('page2');

// Click event to move to to page 2
enterBtn.addEventListener('click', function() {
    const name = nameBox.value.trim();

   
    if (name !== '') {
        page2.scrollIntoView({ behavior: 'smooth' });

       // Fade out plus signs in place
        const plusSigns = document.querySelectorAll('.plus');
        plusSigns.forEach(p => p.classList.add('fade-out'));

         // What happens if no name is entered 
    } else {
        alert('You must have a name, right?');
    }
});

// Enter key event
nameBox.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        enterBtn.click();
    }
    
});

var p5Initialized = false;  

//Next key event
const nextBtn = document.getElementById('nextBtn');
const page3 = document.getElementById('page3');

nextBtn.addEventListener('click', function() {
    page3.scrollIntoView({ behavior: 'smooth' });

//makes sure this only starts when user gets to page 3 
     if (!p5Initialized) {
        initializeCamera();
        p5Initialized = true;
     }
});

function initializeCamera() {
    new p5(function(p) {
        var video;
        var button;
        var snapshots = [];
        var faceapi;
        var detections = [];

        p.setup = function() {
            //   createCanvas (windowWidth, windowHeight);
            let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent('p5-container');
            p.background(0); // black black black
            video = p.createCapture(p.VIDEO);
            video.size(320, 240);
            video.hide();


            //initializes the api face stuff 
            const faceOptions = {
                withLandmarks: true,
                withExpressions: false,
                withDescriptors: false,
                minConfidence: 0.5
            };

            faceapi = ml5.faceApi(video, faceOptions, faceReady);

            button = p.createButton('snap');
            button.parent('p5-container');
            button.style('display','none');
            button.mousePressed(takepic);

            setTimeout (function() {
                button.style('display', 'block');
                button.position((p.windowWidth - 100) / 2, p.windowHeight - 80);
            }, 500);
        };

        function faceReady(){
            faceapi.detect(gotFaces);
        }
        
        function gotFaces(error, result) {
            if (error) {
                console.log(error);
                return;
            }
            detections = result;
            faceapi.detect(gotFaces);
        }

        function takepic(){
            //////
            let snapshot = p.createGraphics(320, 240);

            snapshot.tint(42, 113, 219);
            snapshot.image(video, 0, 0, 320, 240);
            snapshot.noTint();

            //////

            if (detections.length > 0) {
                let scaleX = 320 / video.width;
                let scaleY = 240 / video.height;

                ////

                for(let f = 0; f < detections.length; f++) {
                    let {_x, _y, _width, _height} = detections[f].alignedRect._box;
                    snapshot.stroke(255, 0, 0);
                    snapshot.strokeWeight(2);
                    snapshot.noFill();
                    snapshot.rect(
                        _x * scaleX,
                        _y * scaleY,
                        _width * scaleX,
                        _height * scaleY
                    );

                    /////

                    let points = detections[f].landmarks.positions;
                    snapshot.stroke(255, 0, 0);
                    snapshot.strokeWeight(2);
                    for (let i = 0; i < points.length; i++) {
                        snapshot.point(
                            points[i]._x * scaleX,
                            points[i]._y * scaleY
                        );
                    }
                }
            }
            if (snapshots.length < 2) {
                snapshots.push(snapshot);
            } else {
                snapshots.shift();
                snapshots.push(snapshot);
            }
        }

        // so the tint cant be put in the draw fuction, but everytime each image is drawn in the code is where I need to put the tint to change the camera color 
        p.draw = function() {
            p.background(0); 
            
            
            let windowW = 350; 
            let windowH = 300;
            let spacing = 70;
            
            let totalWidth = windowW * 3 + spacing * 2;
            //centers horizontally
            let startX = (p.width - totalWidth) / 2;
            //centers vertically
            let y = (p.height - windowH) / 2;

            // white borders for all 3 boxes
            p.stroke(255); 
            p.strokeWeight(7);
            p.noFill();
            
            // Box 1: live video
            p.rect(startX, y, windowW, windowH);
            p.push();
            p.tint(42, 113, 219) // camera tint, but you need to reset every time what the f*ck
            p.image(video, startX, y, windowW, windowH);
            p.noTint(); //start then stop tint

            //detection overlay in first box
            drawFaceDetection(startX, y, windowW, windowH);
            p.pop();
            
            // Adds the word in box (FRONT)
            p.fill(255, 255, 255);
            p.noStroke();
            p.textSize(17);
            p.text("FACE FRONT", startX + 5, y + 20);
            
            // Adds the words for boxes 2 and 3
            let labels = ["TURN LEFT", "TURN RIGHT"];
            for (var i = 0; i < 2; i++){
                let boxX = startX + (i + 1) * (windowW + spacing);
                p.stroke(255);
                p.strokeWeight(7);
                p.noFill();
                p.rect(boxX, y, windowW, windowH);
                if (i < snapshots.length) {
                    p.image(snapshots[i], boxX, y, windowW, windowH);
                }
                
                // Add text for boxes 2 and 3
                p.fill(255, 255, 255);
                p.noStroke();
                p.textSize(17);
                p.text(labels[i], boxX + 5, y + 20);
            }
        };

        function drawFaceDetection(offsetX, offsetY, boxWidth, boxHeight) {
            if (detections.length > 0) {
                let scaleX = boxWidth / video.width;
                let scaleY = boxHeight / video.height;

                for(let f = 0 ; f < detections.length; f++) {
                    let  {_x, _y, _width, _height} = detections[f].alignedRect._box;
                    p.stroke(255,0,0);
                    p.strokeWeight(2);
                    p.noFill();
                    p.rect(
                        offsetX + _x * scaleX,
                        offsetY + _y * scaleY,
                        _width * scaleX,
                        _height * scaleY
                    );
                    //landmarks 
                    let points = detections[f].landmarks.positions;
                    p.stroke(255,0,0)
                    p.strokeWeight(2)
                    for (let i = 0; i < points.length; i++) {
                        p.point(
                            offsetX + points[i]._x * scaleX,
                            offsetY + points[i]._y * scaleY
                        );
                    }
                }
            }
        }
       
        p.windowResized = function() {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            if (button) {
                button.position((p.windowWidth - 100) / 2, p.windowHeight - 80);
            }
            // function windowResized() {
            //     resizeCanvas(windowWidth, windowHeight);
        };

    });
}