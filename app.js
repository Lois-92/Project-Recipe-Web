var express = require('express');
var app = express();
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

app.get('/', function (req, res) {
    res.render("home");
});
app.get('/login', function(req,res){
    res.render('login.ejs');
});
app.get('/register', function(req,res){
    res.render('register.ejs');
});
app.listen(3000);
console.log('Node app is running on port 3000');