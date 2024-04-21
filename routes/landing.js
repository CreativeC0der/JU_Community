const express = require('express');
const router = express.Router();
const { checkSessionValid } = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.get('/home', checkSessionValid, async (req, res) => {
    console.log(req.session);
    const conn = await connPromise;
    const [newPosts]=await conn.query('SELECT * FROM posts ORDER BY timestamp DESC LIMIT 3');
    const [newMembers]=await conn.query('SELECT * FROM users ORDER BY timestamp DESC LIMIT 3');
    console.log(newMembers);
    res.render('landing', {
        user: req.session.user.userName,
        newMembers,
        newPosts,
        query:req.query
    });
})

router.get('/view-groups', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [results, fields] = await conn.query('select * from ju_groups');
    const [[admin1,admin2]]=await conn.query('select * from users where userId in (?,?)',['arijitdas','digantasaha']);
    res.render('viewGroups', {
        admin1:admin1,
        admin2:admin2,
        user: req.session.user,
        groups: results,
        query:req.query
    });
})

router.get('/my-profile', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    [[user]] = await conn.query('select * from users where userId=?', [req.session.user.userId]);
    [myGroups] = await conn.query('select * from ju_groups where groupId in(select groupId from members where userId=?)', req.session.user.userId)
    user['dynamicFields']=JSON.parse(user['dynamicFields'])
    console.log(user);
    res.render('myProfile', {
        user: user,
        myGroups: myGroups,
        query:req.query
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