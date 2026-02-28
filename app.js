var express = require('express');
var app = express();
var session = require('express-session');   // session let you store user data between HTTP requests
var conn = require('./dbConfig');

// multer is middleware for uploading files , dest= destination folder
const multer = require("multer");
const recipeUpload = multer({ dest: 'uploads/' });



app.set('view engine', 'ejs');

//cookie is a small piece of data stored in the users browser (it stores a seesion ID)
app.use(session({
    secret:'yoursecret',
    resave: false,                  //  saves session only when changed
    saveUninitialized: false,      // creates session only when needed - logged in users
    cookie: {
        httpOnly: true, 
        maxAge: 1000 * 60* 60 *24 *7     //   how long the session cookie lasts
    }
}));

app.use('/public', express.static('public'));

app.use('/uploads', express.static('uploads'));


// express middleware function
app.use((req, res, next) =>{
    console.log("Current Session User:", req.session.user);
    res.locals.user = req.session.user;   // Assign session data to res.locals to use in all EJS
    next();
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


                    
app.get('/', function (req, res) {
    res.render("home");
});

         
app.get('/recipes/search', function (req, res) {
    const keyword = req.query.q;

    conn.query( "SELECT * FROM recipes Where recipetitle LIKE ?",  
                            //err= erro info , result= data returned from the database
        [`%${keyword}%`], function (err, result) {
            if(err) throw err;
            res.render('recipes', {recipes: result});
        }                          // send data into the page
    );
});




app.get('/login', function(req,res){
    res.render('login.ejs');
});

app.post('/auth',function(req,res) {
    let username = req.body.username;  
    let password = req.body.password;

       // !(Not) username is missing/ empty , ||(or) any part is true
    if (!username || !password) {
        return res.send('Please enter Username and Password!');
    }
        
    conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password],
        function(error,results,) {
            if (error) {
                console.error(error);
                return res.status(500).send('Database error');  // 500 internal server error
            }
                       // no records were found - database fund no matching user
            if(results.length === 0) {
               return res.send('Incorrect Username and/or Password!');
            
            }

           

               req.session.loggedin = true;
               req.session.user = {
                   id: results[0].id,          // ← users.id from db
                   username: results[0].username
                };
               
               req.session.save(() => {
                   return res.redirect('/uploadrecipe');
                }); 
            }
        
        );
        
    });


    


//Users can access this only if they are logged in
app.get('/uploadrecipe', function (req, res, next)  {
    if (req.session.loggedin) {
        res.render('uploadrecipe');
    }
    else {
        res.send('Please login to view this page!');
    }
});



// Route for uploadrecipe
app.post('/uploadrecipe', recipeUpload.single('recipeImage'), function(req, res, next) {
    var recipetitle = req.body.recipetitle;
    var ingredients = req.body.ingredients;
    var instructions = req. body.instructions;
    var userId = req.session.user.id;
    var image;
    if (req.file) {  // check if file was uploaded
        image = req.file.filename;          //multer renames it to prevent conflicts
    } else {
        image = null; 
    }
           
    var sql = `INSERT INTO recipes (recipetitle, ingredients, instructions, image, user_id) VALUES ("${recipetitle}", "${ingredients}", "${instructions}", "${image}", "${userId}")`;
    conn.query(sql, function(err, result) {
        if(err) throw err;
        console.log('record inserted');
        res.redirect('/recipes');
       
    });
});


//route for view a list of all recipes
app.get('/recipes', function (req, res){
    conn.query("SELECT recipes.id, recipes.recipetitle, users.username FROM recipes JOIN users ON recipes.user_id = users.id", function (err, result) {
       if (err) {
         console.error(err);
         return res.status(500).send("Database error");
        }

        console.log(result);
        res.render('recipes', {title: 'recipes', recipes: result});
    });
});



// route for view one specific recipe by its ID
app.get('/recipes/:id', (req,res) => {
     const recipeId =req.params.id;
        
     conn.query("SELECT recipes.*, users.username FROM recipes JOIN users ON recipes.user_id = users.id WHERE recipes.id = ?" ,
       
        [recipeId], (err, result) => {
            if(err) { 
            console.error(err);
            return res.status(500).send("Database error");
            }

            if (!result || result.length === 0) {
                return res.status(404).send('Recipe not found');
            }

        res.render("recipe", { recipe: result[0] });
        }
    );
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




// multer storage configuartion
const storage= multer.diskStorage({  //allows custom folder location and file names
    destination: "./uploads",
    filename:(req,file,cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);   // generate unique filename with current timestamp and extracts file extension
        cb(null, uniqueName); 
    }
});

const upload = multer({
    storage,
    limits:{fileSize: 2*1024*1014}, // 2MB limit
    fileFilter:(req, file, cb) =>{
        const allowed=/jpeg|jpg|png/;
        const isValid =
                // checks file type
        allowed.test(file.mimetype) &&
        allowed.test(path.extname(file.originalname).toLowerCase());
                //get file extension, convert it to lowercase - might reject if incorrect
        if (ifValid) {
           cb(null,true); 
        } else {
            cb(new Error("Images only"), false);
        }
    }
});




app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});


app.listen(3000);
console.log('Node app is running on port 3000');