const passport = require('../middleware/auth');
const prisma = require('../utils/prisma_client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function getLoginPage(req, res) {

    try {
        if (req.isAuthenticated()) {
            res.render('home-page');
        }
        else {
            res.render('login-page');
        };
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

async function handleLogin(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).send(info.message);
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            console.log(`User ${user.id} logged in`);
            return res.redirect('/home');
        });
    })(req, res, next);
}

async function getCreateUserPage(req, res) {
    try {
        res.render('create-user-page');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function handleCreateUser(req, res) {
    try {
        const { email, password, username, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                name
            }
        });

        const userId = user.id;
        const userDir = path.join(__dirname, '../../user_files', userId.toString());
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`Directory created for user ${userId}`);
        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function getHomePage(req, res) {
    try {
        if (req.isAuthenticated()) {
            console.log(req.user);
            res.render('home-page');
        }
        else {
            res.redirect('/login');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function getUserInfo(req, res) {
    try {
        if (req.isAuthenticated()) {
            res.json(req.user);
        }
        else {
            res.status(401).send('Unauthorized');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}


module.exports = {
    getLoginPage,
    getCreateUserPage,
    handleCreateUser,
    handleLogin,
    getHomePage,
    getUserInfo
};