var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
app.set('view engine', 'ejs');
app.use(session({
    secret:'yoursecret',
    resave: true,
    saveUninitialized: true
}));

app.use('/public', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.render("home");
});

app.get('/login', function(req,res){
    res.render('login.ejs');
});

app.post('/auth',function(req,res) {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password],
        function(error,results, fields) {
            if (error) throw error;
            if(results.length > 0) {
               req.session.loggedin = true;
               req.session.username = username;
               res.redirect('/uploadrecipe');
            }else {
               res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });  
    } else {
        res.send('Please enter Username and Password!');
        res.end();
    }
});

app.get('/uploadrecipe', function (req, res, next)  {
    if (req.session.loggedin) {
        res.render('uploadrecipe');
    }
    else {
        res.send('Please login to view this page!');
    }
});

app.get('/register', function(req,res){
    res.render('register.ejs');
});

app.post('/register', function(req, res, next) {
    var username= req.body.username;
    var email= req.body.email;
    var password = req. body.password;
    var sql = `INSERT INTO users (username, email, password) VALUES ("${username}", "${email}", "${password}")`;
    conn.query(sql, function(err, result) {
        if(err) throw err;
        console.log('record inserted');
        res.render('login');
    });
});

app.listen(3000);
console.log('Node app is running on port 3000');