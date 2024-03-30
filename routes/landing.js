const express = require('express');
const router = express.Router();
const { checkSessionValid } = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.get('/home', checkSessionValid, (req, res) => {
    console.log(req.session);
    res.render('landing', {
        user: req.session.user.userName,
    });
})

router.get('/view-groups', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [results, fields] = await conn.query('select * from ju_groups');
    console.log(results);
    // const admins = results.map((group) => group.adminId);
    // console.log(admins);
    res.render('viewGroups', {
        user: req.session.user,
        groups: results
    });
})

router.get('/my-profile', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [user] = await conn.query('select * from users where userId=?', [req.session.user.userId]);
    [invites] = await conn.query('select * from invites where inviteTo=?', [req.session.user.userId]);
    [myGroups] = await conn.query('select * from ju_groups where groupId in(select groupId from members where userId=?)', req.session.user.userId)
    console.log(myGroups);
    res.render('myProfile', {
        user: user[0],
        invites: invites,
        myGroups: myGroups
    })
})

router.get('/view-profiles', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [users] = await conn.query('select * from users');
    console.log(users);
    for (key in users) {
        [groups] = await conn.query('select * from ju_groups where groupId in (select groupId from members where userId=?)', [users[key].userId]);
        console.log(groups);
        users[key].groups = groups;
    }
    console.log(users);
    res.render('viewProfiles', { users: users });
})

module.exports = router