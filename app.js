const express = require('express')
const { checkSessionValid, getSession } = require('./middlewares')
const app = express()
const { connPromise } = require('./dbConnect');
const profileRouter = require('./routes/profile');
const landingRouter = require('./routes/landing');
const groupRouter = require('./routes/group');
const postRouter = require('./routes/posts');
const resourceRouter = require('./routes/resources');
const memberRouter=require('./routes/member');
const adminRouter=require('./routes/admin');
const path = require('path');
const bcrypt=require('bcrypt');
const sanitizeHtml=require('sanitize-html')
require('dotenv').config()

app.use(getSession());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(path.join(process.cwd(), '/static')))

app.set('views', path.join(process.cwd(), '/views/pages'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    const sanitizedQuery = sanitizeHtml(JSON.stringify(req.query));
    res.render('root', {query:sanitizedQuery});
})

app.post('/login', async (req, res) => {
    let uid=req.body.userid;
    let pass=req.body.password;
    const conn = await connPromise;
    const [[user]] = await conn.query('select * from users where userId=?', [uid])
    
    if (user && await bcrypt.compare(pass,user.userPassword)) {
        if(user.approved)
        {
            req.session.valid = true;
            req.session.user = user;
            res.redirect('/landing/home?login=success')
        }
        else
            res.redirect('/?login=notApproved')
    }
    else {
        res.redirect(303, '/?login=failure');
    }

})

app.get('/logout', checkSessionValid, (req, res) => {
    req.session.valid = false;
    req.session.user = {};
    res.redirect('/');
})

app.use('/profile', profileRouter);
app.use('/landing', landingRouter);
app.use('/group', groupRouter);
app.use('/posts', postRouter);
app.use('/resources', resourceRouter);
app.use('/members', memberRouter);
app.use('/admin',adminRouter);

app.listen(process.env.PORT, process.env.HOST, (err) => {
    console.log('listening on ' + process.env.HOST + ' ' + process.env.PORT);
    if (err)
        console.log(err);
})

module.exports = app