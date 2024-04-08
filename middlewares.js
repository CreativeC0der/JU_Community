const session = require('express-session')
const mySqlStore = require('express-mysql-session')(session)
const { dbOptions, connPromise } = require('./dbConnect')

function checkSessionValid(req, res, next) {
    if (!req.session.valid)
        res.redirect('/');
    else
        next();
}

async function checkAdmin(req, res, next) {
    const currUser = req.session.user
    if (currUser.admin == 1) {
        next();
    }
    else {
        res.redirect(303, '/');
    }
}

function getSession() {
    const sessionStore = new mySqlStore(dbOptions)
    const newSession = session({
        secret: 'MySecret',
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: {
            maxAge: 10 * 60 * 60 * 1000
        }
    })
    return newSession;
}


module.exports = { checkSessionValid, getSession, checkAdmin }