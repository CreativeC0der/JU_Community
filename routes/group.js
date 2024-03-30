const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.get('/dashboard', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    const [group] = await conn.query('select * from ju_groups where groupId=?', req.query.groupId)
    const [members] = await conn.query('select * from users where userId in(select userId from members where GroupId=?)', req.query.groupId)
    const [posts] = await conn.query('select * from posts where groupId=?', [req.query.groupId])
    const [nonMembers] = await conn.query('select * from users where userId not in(select userId from members where groupId=?)', [req.query.groupId])
    const [resources]=await conn.query('select * from resources where groupId=?',req.query.groupId)
    console.log(nonMembers);
    res.render('groupDashboard', {
        group: group[0],
        currUser: req.session.user,
        members: members,
        nonMembers: nonMembers,
        posts: posts,
        resources:resources
    });
})

router.get('/create', checkSessionValid, checkAdmin, (req, res, next) => {
    res.render('createGroup', { user: req.session.user })
})

router.post('/create', checkSessionValid, checkAdmin, async (req, res) => {
    console.log(req.body);
    const conn = await connPromise;
    await conn.query('insert into ju_groups(adminId,groupName,groupId,project) values(?,?,?,?)', Object.values(req.body))
    await conn.query('insert into members(userId,groupId) values(?,?)', [req.body.admin_id, req.body.group_id]);
    res.redirect(303, `/group/dashboard?groupId=${req.body.group_id}`)
})

router.post('/sendInvites', checkSessionValid, checkAdmin, async (req, res) => {
    console.log(req.body);
    const conn = await connPromise;
    const query = 'insert into invites(inviteId,inviteFrom,inviteTo,groupId) values (?,?,?,?)';
    for (user of req.body.users) {
        await conn.query(query, [crypto.randomUUID(), req.body.adminId, user, req.body.groupId]);
    }
    res.json({ response: 'Job done!!!' })
})

router.get('/')

module.exports = router