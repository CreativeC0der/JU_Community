const session = require('express-session')
const mySqlStore = require('express-mysql-session')(session)
const { dbOptions, connPromise } = require('./dbConnect')

function checkSessionValid(req, res, next) {
    if (!req.session.valid)
    {
        console.log('checkSessionValid FAILED!');
        res.redirect('/');
    }        
    else
        next();
}

async function checkAdmin(req, res, next) {
    const currUser = req.session.user
    if (currUser.admin == 1) 
        next();
    else 
    {
        console.log('checkAdmin FAILED!');
        res.redirect(303, '/');
    }
        
}

function checkPostUser(req,res,next) {
    console.log(req.query);
    if(req.query.userId==req.session.user.userId)
        next()
    else
    {
        console.log('checkPostUser FAILED!');
        checkAdmin(req,res,next);
    }
       
}

async function checkGroupMember(req,res,next) {
    const conn = await connPromise;
    const query = 'select userId from members where groupId=?';
    let [memberIds]=await conn.query(query,[req.query.groupId])
    memberIds=memberIds.map(member=>member.userId)
    console.log(memberIds);
    if(memberIds.includes(req.session.user.userId))
        next();
    else
    {
        console.log('checkGroupMember FAILED!');
        checkAdmin(req,res,next);
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


module.exports = { checkGroupMember,checkPostUser,checkSessionValid, getSession, checkAdmin }