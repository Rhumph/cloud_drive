const express = require('express');
const session = require('express-session');
const passport = require('./middleware/auth');
const userRoutes = require('./routes/user_router');
const fileRoutes = require('./routes/file_router');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Make sure this is before Multer

app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'utils')));

// Log the body to ensure it's parsed before file upload
app.use((req, res, next) => {
    console.log('Request body in server.js:', req.body);
    next();
});

// Routes
app.use('/', userRoutes);
app.use('/home', ensureAuthenticated, fileRoutes);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
