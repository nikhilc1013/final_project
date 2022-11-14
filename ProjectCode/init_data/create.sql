DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
username VARCHAR(50) PRIMARY KEY,
password CHAR(60) NOT NULL
);

DROP TABLE IF EXISTS meals CASCADE;
CREATE TABLE meals(
name VARCHAR(50) PRIMARY KEY,
carbs int NOT NULL,
sodium int NOT NULL,
sugars int NOT NULL,
protein int NOT NULL,
cals int NOT NULL
);

DROP TABLE IF EXISTS calendars CASCADE;
CREATE TABLE calendars(
id int PRIMARY KEY,
dayofmonth int NOT NULL,
timeofmeal time NOT NULL,
meal VARCHAR(50) NOT NULL,
username VARCHAR(50) NOT NULL,
FOREIGN KEY (meal) REFERENCES meals (name),
FOREIGN KEY (username) REFERENCES users (username)
);