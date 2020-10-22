//important video and tracking Variables
var cnv;
var capture;
var constraints = { video: { facingMode: "environment" }, audio: false };
var curpyr, prevpyr, pointCount, pointStatus, prevxy, curxy;
var w,h;
var maxPoints = 1;
var socket;

//app variables
var startApp = false;
var yAvg;
var gameButton;
var inp;
var intro;

//distance variable
var screenRes;
var inches=0;
var dpi_x,dpi_y; // DPI(Dots per inch) needed to convert pixels to inches

//motion variables
var alph = 0,beta = 0,gamma = 0;
var upRight = false;
var repCount=0;
var squatCleared = false;
var fixedPoint = [];

var unique_username;


window.addEventListener("deviceorientation", handleOrientation, true);
window.addEventListener('load',cameraStart,true);

function register_user() {
    var data = {
        unique_username: unique_username,
    };
    socket.emit('register_user',data);
}

function mousePressed() {
    if(pointCount <maxPoints){
        addPoint(mouseX, mouseY);
        fixedPoint[0] = mouseX;
        fixedPoint[1] = mouseY;
    }


}

function startGame(){
    unique_username = inp.value();
    startApp = true;
    gameButton.hide();
    inp.hide();
    register_user();
}

function setup() {
    w = windowWidth;
    h = windowHeight;

    socket = io();

    var col = color(235,81,15);

    //fontCol = color(255);
    gameButton = createButton('Start');
    gameButton.mouseClicked(startGame);
    gameButton.size(100,40);
    gameButton.position(10,200);
    gameButton.style('background-color',col);
    gameButton.style("font-size", "18px");
    gameButton.style('text-align', 'center');

    inp = createInput('').attribute('placeholder', 'Name');
    inp.position(120,200);
    inp.size(150,35);
    inp.style('font-size', '18px');
    inp.style('text-align', 'center');

    //Getting DPI(Dots Per Inch) of screen. Needed for pixel to inch converson
    dpi_x = document.getElementById('testdiv').offsetWidth;
    dpi_y = document.getElementById('testdiv').offsetHeight;

    capture = createCapture(constraints, function() {
        console.log('capture ready.');
    });
    capture.elt.setAttribute('playsinline', '');
    cnv = createCanvas(w, h);
    capture.size(w, h);
    capture.hide();

    curpyr = new jsfeat.pyramid_t(3);
    prevpyr = new jsfeat.pyramid_t(3);
    curpyr.allocate(w, h, jsfeat.U8C1_t);
    prevpyr.allocate(w, h, jsfeat.U8C1_t);

    pointCount = 0;
    pointStatus = new Uint8Array(maxPoints);
    prevxy = new Float32Array(maxPoints * 2);
    curxy = new Float32Array(maxPoints * 2);
}

function addPoint(x, y) {
    if (pointCount < maxPoints) {
        var pointIndex = pointCount * 2;
        curxy[pointIndex] = x;
        curxy[pointIndex + 1] = y;
        pointCount++;
    }
}

function prunePoints() {
    var outputPoint = 0;
    for (var inputPoint = 0; inputPoint < pointCount; inputPoint++) {
        if (pointStatus[inputPoint] == 1) {
            if (outputPoint < inputPoint) {
                var inputIndex = inputPoint * 2;
                var outputIndex = outputPoint * 2;
                curxy[outputIndex] = curxy[inputIndex];
                curxy[outputIndex + 1] = curxy[inputIndex + 1];
            }
            outputPoint++;
            yAvg=0;
        }
    }

    pointCount = outputPoint;
}

function draw() {

    if(startApp) {
        image(capture, 0, 0, w, h);
        capture.loadPixels();
        if (capture.pixels.length > 0) { // don't forget this!

            var xyswap = prevxy;
            prevxy = curxy;
            curxy = xyswap;
            var pyrswap = prevpyr;
            prevpyr = curpyr;
            curpyr = pyrswap;

            // these are options worth breaking out and exploring
            var winSize = 20;
            var maxIterations = 30;
            var epsilon = 0.01;
            var minEigen = 0.001;

            jsfeat.imgproc.grayscale(capture.pixels, w, h, curpyr.data[0]);
            curpyr.build(curpyr.data[0], true);
            jsfeat.optical_flow_lk.track(
                prevpyr, curpyr,
                prevxy, curxy,
                pointCount,
                winSize, maxIterations,
                pointStatus,
                epsilon, minEigen);
            prunePoints();

            for (var i = 0; i < pointCount; i++) {
                var pointOffset = i * 2;
                // var speed = Math.abs(prevxy[pointOffset] - curxy[pointOffset]);
                line(fixedPoint[0], fixedPoint[1], curxy[pointOffset], curxy[pointOffset + 1]);

                var r = 8;
                fill(255, 0, 0);
                ellipse(curxy[pointOffset], curxy[pointOffset + 1], r, r);
                fill(0, 255, 0);
                ellipse(fixedPoint[0], fixedPoint[1], r, r);

                var d = int(dist(fixedPoint[0], fixedPoint[1], curxy[pointOffset], curxy[pointOffset + 1]));
                inches = d / dpi_y;

                push();
                translate((fixedPoint[0] + curxy[pointOffset]) / 2, (fixedPoint[1] + curxy[pointOffset + 1]) / 2);
                rotate(atan2(curxy[pointOffset + 1] - fixedPoint[1], curxy[pointOffset] - fixedPoint[0]));
                text(nfc(inches, 1), 0, -5);
                pop();


                countReps(curxy[pointOffset + 1]);
            }


            //blk rect and white text to display position
            fill(0);
            rect(0, 0, w, 50);

            //text on rect
            fill(255);
            textSize(18);
            text('Reps: ' + repCount, 0, 20);
            text('Camara Angle: ' + beta + '\u00B0', 100, 20);
            text('Distance from point: ' + nfc(inches, 1) + '"', 0, 45);

            if (squatCleared) {
                fill(0, 255, 0);
                textSize(20);
                text('Squat cleared', 0, 100);
            } else {
                fill(255);
            }

            if (!upRight) {
                textSize(30);
                //text('Keep Camera Straight',0,250);
                text('Keep Camera Straight', w / 2, h / 2);
            }

            if (pointCount === 0) {
                inches = 0;
                fixedPoint = [];
                squatCleared = false;
            }


        }
    }
    else{
        background(255);

        textSize(25);
        textStyle(BOLD);
        text("Welcome to Mathercize",10,30);

        textSize(18);
        text("This app uses your phone's camera and your environment to help improve your squat game!",10,55);
        text("To ensure efficiency please do the following.",10,75);

        textSize(16);
        textStyle(NORMAL);
        text("To the best of your ability stand 2 feet away from a wall",10,105);
        text("Keep camera angle around 90 degrees (Perpendicular to the ground)",10,125);
        text("Pick a point on the lower half of the screen to use as a reference.",10,145);
        text("Slow and steady squat down until the green \"Squat cleared\" pops up.",10,165);
        text("When ready, enter your name below to start your work out",10,185);


    }
}

function handleOrientation(event) {
    //alph = Math.round(event.alpha); // z-axis (0-360) up and down motion
    beta = Math.round(event.beta);  // x-axis (-180-180) front and back motion
    // gamma = Math.round(event.gamma); //y-axis (-90-90) left and right motion

    // Do stuff with the new orientation data
    if( beta>= 80 && beta <=100){
        upRight = true;
    }
    else{
        upRight = false;
    }

}

function countReps(y){

    var dist = int(inches);

    if(y < fixedPoint[1]){

        if(dist >= 2){
            squatCleared = true;
        }

    }else if(y > fixedPoint[1]){
        inches = (-inches);

        if(squatCleared){
            repCount++;
            squatCleared = false;
        }
    }


}

function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            capture.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
}
