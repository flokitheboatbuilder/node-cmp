const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');
//connect to mongo db
mongoose.connect(config.database, {useMongoClient: true});
let db = mongoose.connection;
mongoose.Promise = global.Promise;
//check connection
db.once('open', function () {
  console.log('connected to mongo db');
});
//check for db errors
db.on('error', function (err) {
  console.log(err);
});
//init app
const app = express();

//bring in models
let Article = require('./models/article');

//load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
//set public folder
app.use(express.static(path.join(__dirname, 'public')));
//express-session-middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));
//express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//express-validator middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//passport config
require('./config/passport')(passport);
//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

//home route
app.get('/', function (req, res) {
  Article.find({}, function (err, articles) {
    if (err) {
      return console.log(err);
    }
    res.render('index', {
      title: 'Here are the posts available to you :',
      articles: articles
    });
  });
});

//route files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);


//start server
app.listen(3000, function () {
  console.log('app is running on port 3000');
});
