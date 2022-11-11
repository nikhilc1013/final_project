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