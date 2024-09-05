// Load all necessary Node.js modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Define the port to use
const PORT = 33345;
app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the 'client' directory


// Test database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: "databaseManager",
    password: "Testing",
    database: "WebChat"
});

// Connect to the database with error handling
connection.connect();

// Handle requests

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.post("/create/database", function (req, res) {
    console.log(req.body.db);
    
    // Use parameterized query to insert user
    connection.query('CREATE DATABASE ' + req.body.db, function (err, result) {
        if (err) {
            console.error("Error creating user:", err);
            res.status(500).send(err);
            return;
        }
    });
});

app.get('/FetchDatabases', (req, res) => {
    console.log("Recieved")
    connection.query('SHOW DATABASES', function (err, result, fields) {
        console.log(result)
        let data = JSON.parse(JSON.stringify(result));
        console.log(data)
        res.send(data);
    });
});
app.get('/get/Tables/:a', (req, res) => {
    console.log("Recieved")
    connection.query(`use ${req.params.a}`)
    connection.query('SHOW TABLES', function (err, result, fields) {
        console.log(result)
        let data = JSON.parse(JSON.stringify(result));
        console.log(data)
        res.send(data);
    });
});
app.get('/get/columns/:a/:b', (req, res) => {
    console.log("Recieved")
    connection.query(`use ${req.params.a}`)
    connection.query('DESCRIBE ' + req.params.b, function (err, result, fields) {
        console.log(result)
        let data = JSON.parse(JSON.stringify(result));
        console.log(data)
        res.send(data);
    });
});
app.get('/Select/data/:a/:b', (req, res) => {
    console.log("Recieved")
    connection.query(`use ${req.params.a}`)
    connection.query('SELECT * FROM ' + req.params.b, function (err, result, fields) {
        console.log(result)
        let data = JSON.parse(JSON.stringify(result));
        console.log(data)
        res.send(data);
    });
});




app.use(express.static("public"));