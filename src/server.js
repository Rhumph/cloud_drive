const express = require('express');
const session = require('express-session');
const passport = require('./middleware/auth');
const userRoutes = require('./routes/user_router');
const fileRoutes = require('./routes/file_router');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({  secret: 'your_secret_key',  resave: false,  saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use('/', userRoutes);
app.use('/home', passport.authenticate('session'), fileRoutes);


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});