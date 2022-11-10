const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
// const axios = require('axios');

// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  };
  
  const db = pgp(dbConfig);
  
  // test your database
  db.connect()
    .then(obj => {
      console.log('Database connection successful'); // you can view this message in the docker compose logs
      obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('ERROR:', error.message || error);
    });





    app.set('view engine', 'ejs');



    app.use(bodyParser.json());



    app.use(
        session({
          secret: "something",
          saveUninitialized: false,
          resave: false,
        })
      );
      
      app.use(
        bodyParser.urlencoded({
          extended: true,
        })
      );



      app.listen(3000);
console.log('Server is listening on port 3000');


app.get('/', (req, res) =>{
    res.redirect('/login'); //this will call the /anotherRoute route in the API
  });





  app.get('/register', (req, res) => {
    res.render('pages/register');
  });



  app.post('/register', async (req, res) => {
    //the logic goes here
    var username = req.body.username;
    const hash = await bcrypt.hash(req.body.password, 10);

    const query ='insert into users (username,password) values ($1,$2) returning *';
  db.any(query, [
    username,
    hash,
  ])
  .then(function (data) {
    res.redirect('/login');
  })
  .catch(function (err) {

  });
});


  app.get('/login', (req, res) => {
    res.render('pages/login');
  });


  app.post('/login', (req, res) => {
    //the logic goes here
    const query ='select password from users where username=$1';
    // const match = await bcrypt.compare(req.body.password, user.password); //await is explained in #8
    db.one(query, [req.body.username])
    .then(async (data) => {
      const match = await bcrypt.compare(req.body.password, data.password); 
      if(match)
        {
            req.session.user = {
              api_key: "something",
            };
            req.session.save();
            res.redirect("/discover");
        }
        else
        {
            res.render("pages/login", {message:"Wrong username or password"});
            // add message statement
        }
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/register");
    });

});



const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to register page.
      return res.redirect('/register');
    }
    next();
  };
  
  // Authentication Required
  app.use(auth);


  app.get('/home', (req, res) => {
    res.render('pages/home');
  });


app.get('/progress', (req, res) => {
    res.render('pages/progress');
  });


  app.get('/calendar', (req, res) => {
    res.render('pages/calendar');
  });

  app.get('/goals', (req, res) => {
    res.render('pages/goals');
  });

  app.get('/meals', (req, res) => {
    res.render('pages/meals');
  });



  app.get('/logout', (req, res) => {
    res.render('pages/login');
    req.session.destroy();
  });