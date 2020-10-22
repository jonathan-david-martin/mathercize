



// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
var hostname = '0.0.0.0';
var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
const path = require('path');

var mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://user1:squat1234@cluster0.wfjgo.mongodb.net/mathercizedb?retryWrites=true&w=majority'

var mathercizeDB;

MongoClient.connect(uri, function (err, client) {
    if (err) throw err;
    var dbo = client.db("mathercizedb");
    dbo.createCollection("test",function(err,res){
        if(err) throw err;
        console.log("Collection Created");
        db.close();

    });
    //mathercizeDB = client.db('mathercizedb').collection('mathercize_coll');
});
app.use(express.static(__dirname));


var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

server.listen(port, hostname, function () {
    console.log('listening on ' + hostname + ':' + port);
});

io.sockets.on('connection',
    // We are given a websocket object in our function
    function (socket) {

//io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('register_user',
            function(data) {
                var unique_username = data.unique_username;
                mathercizeDB.insertOne({
                    username: unique_username
                }, function (err, result) {
                    if (err) throw err;
                });
            }
        );

        socket.on('register_score',
            function(data) {
                console.log('register score on server')
                var unique_username = data.unique_username;
                var score = data.score;
                mathercizeDB.insertOne({
                    username: unique_username,
                    score: score
                }, function (err, result) {
                    if (err) throw err;
                });
            }
        );


        socket.on('get_scores', function(data) {
            mathercizeDB.find( {} ).sort( { score: -1 }).toArray(
                function(err, result) {

                    //console.log(result);
                    //only send to client
                    socket.emit('scores_from_db',result);

                    if (err) throw err;
                });
        });

    });


// //===================mongodb parctice================
//========= create Database============================
function createDB(){
    MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });
}

// ========Create collection=========================
function createCollection(cName){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mathercizedb");
        dbo.createCollection(cName, function(err, res) {
            if (err) throw err;
            console.log("Collection created!");
            db.close();
        });
    });
}

//=========Insert into collection======================
function insertData(data){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mathercizedb");
        var myobj = { name: "Company Inc", address: "Highway 37" };
        dbo.collection("practice").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
}

