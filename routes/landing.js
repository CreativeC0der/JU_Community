const express = require('express');
const router = express.Router();
const { checkSessionValid } = require('../middlewares');
const { connPromise } = require('../dbConnect');
const sanitizeHtml=require('sanitize-html');

router.get('/home', checkSessionValid, async (req, res) => {
    console.log(req.session);
    const conn = await connPromise;
    const [newPosts]=await conn.query('SELECT * FROM posts ORDER BY timestamp DESC LIMIT 3');
    const [newMembers]=await conn.query('SELECT * FROM users ORDER BY timestamp DESC LIMIT 5');
    const sanitizedQuery = sanitizeHtml(JSON.stringify(req.query));

    res.render('landing', {
        user: req.session.user.userName,
        newMembers,
        newPosts,
        query:sanitizedQuery
    });
})

router.get('/view-groups', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [results, fields] = await conn.query('select * from ju_groups');
    const [[admin1,admin2]]=await conn.query('select * from users where userId in (?,?)',['arijitdas','digantasaha']);
    const sanitizedQuery = sanitizeHtml(JSON.stringify(req.query));
    res.render('viewGroups', {
        admin1:admin1,
        admin2:admin2,
        user: req.session.user,
        groups: results,
        query:sanitizedQuery
    });
})

router.get('/my-profile', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [[user]] = await conn.query('select * from users where userId=?', [req.session.user.userId]);
    [myGroups] = await conn.query('select * from ju_groups where groupId in(select groupId from members where userId=?)', req.session.user.userId)
    user['dynamicFields']=JSON.parse(user['dynamicFields'])
    const sanitizedQuery = sanitizeHtml(JSON.stringify(req.query));
    res.render('myProfile', {
        user: user,
        myGroups: myGroups,
        query:sanitizedQuery
    })
})

router.get('/view-profiles', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [users] = await conn.query('select * from users where admin=0 AND approved=1');
    console.log(users);
    for (user of users) {
        [groups] = await conn.query(
            'select * from ju_groups where groupId in (select groupId from members where userId=?)', 
            [user.userId]);
        user.groups = groups;
        user.dynamicFields=JSON.parse(user['dynamicFields'])
    }
    console.log(users);
    res.render('viewProfiles', { users: users });
})

module.exports = router