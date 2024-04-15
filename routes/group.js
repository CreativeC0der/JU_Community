const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.get('/dashboard', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    const [group] = await conn.query('SELECT * FROM ju_groups WHERE groupid=?', req.query.groupId)
    const [members] = await conn.query('SELECT * FROM users WHERE userid IN(SELECT userid FROM members WHERE groupid=?)', req.query.groupId)
    const [posts] = await conn.query('SELECT posts.*,userName FROM posts INNER JOIN users ON posts.userId=users.userId WHERE groupId=?', [req.query.groupId])
    const [nonMembers] = await conn.query('SELECT * FROM users WHERE userid NOT IN(SELECT userid FROM members WHERE groupid=?)', [req.query.groupId])
    const [resources]=await conn.query('SELECT * FROM resources WHERE groupId=?',req.query.groupId)
    
    res.render('groupDashboard', {
        group: group[0],
        currUser: req.session.user,
        members: members,
        nonMembers: nonMembers,
        posts: posts,
        resources:resources,
        query:req.query
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

router.get('/edit',checkSessionValid,checkAdmin,async(req,res)=>{
    console.log(req.query.groupId);
    const conn = await connPromise;
    const query = 'select * from ju_groups where groupId=?';
    const [[group]]=await conn.query(query,[req.query.groupId])
    console.log(group);
    res.render('editGroup',{group});
})

router.post('/edit',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.body);
    const conn = await connPromise;
    const query = 'update ju_groups set groupName=?,project=? where groupId=?';
    const [results]=await conn.query(query,[req.body.groupName,req.body.project,req.body.groupId])
    res.redirect(`/group/dashboard?groupId=${req.body.groupId}`);
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.query);
    const conn=await connPromise;
    const query = 'DELETE FROM ju_groups WHERE groupId=?';
    const [results]=await conn.query(query,[req.query.groupId])
    console.log(results);
    res.redirect(`/landing/view-groups`);
})

module.exports = router