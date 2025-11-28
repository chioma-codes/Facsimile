
//scroll lock function
let currentPage = 1;

window.addEventListener("scroll", () => {
    const allowedTop = window.innerHeight * (currentPage - 1);

    if (window.scrollY < allowedTop) {
        window.scrollTo({
            top: allowedTop,
            behavior: "auto"
        });
    }
});


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

    } else {
        // What happens if no name is entered 
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

// Next key event
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
        var currentBox = 1;

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
            button.style('display', 'none');
            button.mousePressed(takepic);

            setTimeout(function() {
                button.style('display', 'block');
                button.position((p.windowWidth - 100) / 2, p.windowHeight - 80);
            }, 500);
        };

        function faceReady() {
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

        function drawFaceOverlay(graphics, scaleX, scaleY) {
            for (let f = 0; f < detections.length; f++) {
                let { _x, _y, _width, _height } = detections[f].alignedRect._box;

                graphics.stroke(255, 0, 0);
                graphics.strokeWeight(2);
                graphics.noFill();
                graphics.rect(
                    _x * scaleX,
                    _y * scaleY,
                    _width * scaleX,
                    _height * scaleY
                );

                let points = detections[f].landmarks.positions;
                graphics.strokeWeight(2);
                for (let i = 0; i < points.length; i++) {
                    graphics.point(
                        points[i]._x * scaleX,
                        points[i]._y * scaleY
                    );
                }
            }
        }

        function takepic() {
            ////// 
            let snapshot = p.createGraphics(320, 240);

            snapshot.tint(42, 113, 219);
            snapshot.image(video, 0, 0, 320, 240);
            snapshot.noTint();
            //////

            if (detections.length > 0) {
                let scaleX = 320 / video.width;
                let scaleY = 240 / video.height;
                drawFaceOverlay(snapshot, scaleX, scaleY);
            }

            snapshots.push(snapshot);
            currentBox++;

            if (currentBox > 3) {
                //change snap button to arrow button to go to page 4
                button.html('→');
                button.style('font-size', '24px');
                button.style('display', 'block');

                button.mousePressed(function() {
                    const page4 = document.getElementById('page4');
                    if (page4) {
                        page4.scrollIntoView({ behavior: 'smooth' });

                        //makes sure this only starts when user gets to page 4
                        if (!pg4Initialized) {
                            initializeMorphVideo();
                            pg4Initialized = true;
                        }
                    }
                });
            }
        }

        // so the tint cant be put in the draw fuction, but everytime each image is drawn in the code is where I need to put the tint to change the camera color 
        p.draw = function() {
            p.background(0);

            let windowW = 350;
            let windowH = 300;
            let spacing = 70;

            let totalWidth = windowW * 3 + spacing * 2;
            let startX = (p.width - totalWidth) / 2;
            let y = (p.height - windowH) / 2;

            let labels = ["FACE FRONT", "TURN LEFT", "TURN RIGHT"];

            for (var i = 0; i < 3; i++) {
                let boxX = startX + i * (windowW + spacing);

                p.stroke(255);
                p.strokeWeight(7);
                p.noFill();
                p.rect(boxX, y, windowW, windowH);

                if (i + 1 === currentBox) {
                    p.push();
                    p.tint(42, 113, 219);
                    p.image(video, boxX, y, windowW, windowH);
                    p.noTint();
                    drawFaceDetection(boxX, y, windowW, windowH);
                    p.pop();

                } else if (i < snapshots.length) {
                    p.image(snapshots[i], boxX, y, windowW, windowH);
                }

                // Adds the word in box (FRONT)
                p.fill(255);
                p.noStroke();
                p.textSize(17);
                p.text(labels[i], boxX + 5, y + 20);
            }
        };

        function drawFaceDetection(offsetX, offsetY, boxWidth, boxHeight) {
            if (detections.length > 0) {
                let scaleX = boxWidth / video.width;
                let scaleY = boxHeight / video.height;

                p.stroke(255, 191, 0);
                p.strokeWeight(3);
                p.noFill();

                for (let f = 0; f < detections.length; f++) {
                    let { _x, _y, _width, _height } = detections[f].alignedRect._box;

                    p.rect(
                        offsetX + _x * scaleX,
                        offsetY + _y * scaleX,
                        _width * scaleX,
                        _height * scaleY
                    );

                    let points = detections[f].landmarks.positions;
                    p.strokeWeight(1);
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
        };
    });
}

var pg4Initialized = false;

function initializeMorphVideo() {
    new p5(function(p) {
        var video;

        p.setup = function() {
            let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent('page4');
            p.background(0);

            video = p.createCapture(p.VIDEO);
            video.size(320, 240);
            video.hide();
        };

        p.draw = function() {
            let windowW = 450;
            let windowH = 400;

            let x = (p.width - windowW) / 2;
            let y = (p.height - windowH) / 2;

            p.stroke(255);
            p.strokeWeight(7);
            p.noFill();
            p.rect(x, y, windowW, windowH);

            p.image(video, x, y, windowW, windowH);
        };
    });
}