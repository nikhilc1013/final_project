const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

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

const all_meals = `SELECT * FROM meals ORDER BY meals.name ASC;`;

const user_meals_on_calendar = `SELECT calendars.dayofmonth, calendars.id, calendars.timeofmeal, calendars.meal FROM calendars WHERE username=$1 ORDER BY calendars.timeofmeal ASC;`;

var mealsCount = 0;
var mealsCountquery = 'SELECT COUNT(calendars.id) AS count FROM calendars;'

app.get('/', (req, res) =>{
  if(req.session.user) res.redirect('/home');
  res.redirect('/login'); //this will call the /anotherRoute route in the API
});





  app.get('/register', (req, res) => {
    if(req.session.user) res.redirect('/home');
    else res.render('pages/register');
  });



  app.post('/register', async (req, res) => {
    //the logic goes here
    var username = req.body.username;
    const hash = await bcrypt.hash(req.body.password, 10);

    const query ='insert into users (username,password, bmr) values ($1,$2, $3) returning *';
  db.any(query, [
    username,
    hash,
    0,
  ])
  .then(function (data) {
    res.redirect('/login');
  })
  .catch(function (err) {

  });
});


app.get('/login', (req, res) => {
  if(req.session.user) res.redirect('/home');
  else res.render('pages/login');
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
            username: req.body.username,
          };
          req.session.save();
          res.redirect("/home");
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
  var userbmr;  
  var getbmr = "select bmr from users where users.username = $1";
    db.any(getbmr,[req.session.user.username])
    .then((data) => {
      console.log("Inside then", data[0].bmr, data[0]);
      if (data[0].bmr == 0){
        res.redirect('/calculator');
      }
      else {
        var daterequestedbyuser = 1;
        var getsumofdate = "SELECT sum(meals.cals) AS calories, sum(meals.carbs) AS carbohydrates, sum(meals.sodium) AS sodium, sum(meals.sugars) AS sugars, sum(meals.protein) AS protein FROM calendars INNER JOIN meals ON calendars.meal = meals.name WHERE calendars.username = $1 AND calendars.dayofmonth = $2;"; 
        db.any(getsumofdate,[req.session.user.username, daterequestedbyuser,])
         .then((data2) => {
            console.log(data2);
            var usersbmr = data[0].bmr;
            console.log(usersbmr);
            res.render('pages/progress',{data2, usersbmr, daterequestedbyuser, message: "If no pie charts are showing, please note that you have to enter in data in calendar"});
         })
         .catch((err) => {
           console.log(err);
           res.redirect('/calendar');
         });
      }
    })
    .catch((err) => {
      console.log(err);
      userbmr = 0;
    });
  });

  
  app.post('/progress', (req, res) => {
    var userbmr;  
  var getbmr = "select bmr from users where users.username = $1";
    db.any(getbmr,[req.session.user.username])
    .then((data) => {
      console.log("Inside then", data[0].bmr, data[0]);
      if (data[0].bmr == 0){
        res.redirect('/calculator');
      }
      else {
        var daterequestedbyuser = req.body.date;
        var getsumofdate = "SELECT sum(meals.cals) AS calories, sum(meals.carbs) AS carbohydrates, sum(meals.sodium) AS sodium, sum(meals.sugars) AS sugars, sum(meals.protein) AS protein FROM calendars INNER JOIN meals ON calendars.meal = meals.name WHERE calendars.username = $1 AND calendars.dayofmonth = $2;"; 
        db.any(getsumofdate,[req.session.user.username, daterequestedbyuser,])
         .then((data2) => {
            console.log(data2);
            var usersbmr = data[0].bmr;
            console.log(usersbmr);
            res.render('pages/progress',{data2, usersbmr, daterequestedbyuser, message: "If no pie charts are showing, please note that you have to enter in data in calendar"});
         })
         .catch((err) => {
           console.log(err);
           res.redirect('/calendar');
         });
      }
    })
    .catch((err) => {
      console.log(err);
      userbmr = 0;
    });
  });

  app.get('/calendar', (req, res) => {
    var mealss;
    db.any(all_meals,[])
    .then((mealsList) => {
      mealss = mealsList;
    })
    .catch((err) => {
      console.log(err);
        mealss = [];
    });



    db.any(user_meals_on_calendar,[req.session.user.username])
    .then((userMeals) => {
      res.render("pages/calendar", {
        userMeals,
        week:0,
        mealsList:mealss,
      });
    })
    .catch((err) => {
      console.log(err);
      res.render("pages/calendar", {
        userMeals: [],
        mealsList: [],
        week:0,
      });
    });
  });

  app.post('/calendar', (req, res) => {
    console.log(req.body.identifier);
    if(req.body.identifier == "changeweek")
    {
      var week = parseInt(req.body.week);
      var mealss;
      db.any(all_meals,[])
      .then((mealsList) => {
        mealss = mealsList;
      })
      .catch((err) => {
        console.log(err);
          mealss = [];
      });



      db.any(user_meals_on_calendar,[req.session.user.username])
      .then((userMeals) => {
        res.render("pages/calendar", {
          userMeals,
          week,
          mealsList:mealss,
        });
      })
      .catch((err) => {
        console.log(err);
        res.render("pages/calendar", {
          userMeals: [],
          mealsList: [],
          week,
        });
      });
    }
    else if(req.body.identifier == "makemeal")
    {
      db.any(mealsCountquery,[])
      .then((data) => {
        mealsCount = data[0].count;
      });
      var time = req.body.time;
      var date = req.body.date;
      var meal = req.body.meal;
      const query = 'insert into calendars (id, dayofmonth, timeofmeal, meal, username) values ($1, $2, $3, $4, $5) returning *'
      db.any(query, [mealsCount,date, time, meal, req.session.user.username])
      .then(function(data) {
        mealsCount++;
        res.redirect('/calendar');
      })
      .catch((err) => {
        console.log(err);
        res.redirect('/calendar');
      });
    }
  });

  app.get('/meals', (req, res) => {
    db.any(all_meals, [])
    .then(function(meals){
      res.render("pages/meals", {
        meals,
      });
    })
    .catch((err) => {
      res.render("pages/meals", {
        meals:[],
      });
      console.log(err);
    });
  });

  app.post('/meals', (req, res) => {
    var name = req.body.name;
    var carbs = req.body.carbs;
    var sodium = req.body.sodium;
    var sugars = req.body.sugars;
    var protein = req.body.protein;
    var cals = req.body.cals;
    const query = 'insert into meals (name, carbs, sodium, sugars, protein, cals) values ($1, $2, $3, $4, $5, $6) returning *'
    db.any(query, [name, carbs, sodium, sugars, protein, cals])
    .then(function(data) {
      res.redirect('/meals');
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/meals");
    });
  });

  app.get('/calculator', (req, res) => {
    res.render('pages/calculator',{message:"Please enter this information to calculate your BMR"});
  });

  app.post('/calculator', (req, res) => {
    console.log(req.body.gender);
    var weight = req.body.weight;
    var height = req.body.height;
    var age = req.body.age;
    var gender = req.body.gender;
    var bmr = 0;

    if(gender == 'female'){
      bmr = 655+(9.6*weight)+(1.8*height)-(4.7*age);
    }
    else if (gender == 'male'){
      bmr = 66+(13.7*weight)+(5*height)-(6.8*age);
    }
    else if(gender == 'other'){
      bmr = 66+(13.7*weight)+(5*height)-(6.8*age);
    }

    const updatequery = "UPDATE users SET bmr=$1 WHERE username=$2;";
    db.any(updatequery, [bmr, req.session.user.username])
    .then(function(data){
      console.log(bmr);
      res.render("pages/calculator", {message:"Successfully added BMR. You may go to another page"});
    })
    .catch((err) => {
      console.log(err);
    });

  });



  app.get('/logout', (req, res) => {
    res.render('pages/login');
    req.session.destroy();
  });