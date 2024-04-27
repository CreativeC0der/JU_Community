const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');
const sanitizeHtml=require('sanitize-html');

router.get('/dashboard', checkSessionValid, async (req, res) => {
    const conn = await connPromise;
    const [group] = await conn.query('SELECT * FROM ju_groups WHERE groupid=?', req.query.groupId)
    const [members] = await conn.query('SELECT * FROM users WHERE userid IN(SELECT userid FROM members WHERE groupid=? AND approved=1)', req.query.groupId)
    const [posts] = await conn.query('SELECT posts.*,userName FROM posts INNER JOIN users ON posts.userId=users.userId WHERE groupId=?', [req.query.groupId])
    const [nonMembers] = await conn.query('SELECT * FROM users WHERE userid NOT IN(SELECT userid FROM members WHERE groupid=?) AND approved=1', [req.query.groupId])
    const [resources]=await conn.query('SELECT * FROM resources WHERE groupId=?',req.query.groupId)
    const sanitizedQuery = sanitizeHtml(JSON.stringify(req.query));
    res.render('groupDashboard', {
        group: group[0],
        currUser: req.session.user,
        members: members,
        nonMembers: nonMembers,
        posts: posts,
        resources:resources,
        query:sanitizedQuery
    });
})

router.get('/create', checkSessionValid, checkAdmin, async (req, res, next) => {
    const conn=await connPromise;
    const [groups]=await conn.query('SELECT LOWER(groupId) as groupId FROM ju_groups',[]);
    const groupIds=groups.map(group=>group.groupId);
    console.log(groupIds);
    res.render('createGroup', { user: req.session.user,groupIds})
})

router.post('/create', checkSessionValid, checkAdmin, async (req, res) => {
    try{
        console.log(req.body);
        const conn = await connPromise;
        await conn.query('insert into ju_groups(adminId,groupId,groupName,project) values(?,?,?,?)', [
            req.body.admin_id,
            req.body.group_id,
            req.body.group_name,
            req.body.project
        ])
        await conn.query('insert into members(userId,groupId) values(?,?)', [req.body.admin_id, req.body.group_id]);
        res.redirect(303, `/group/dashboard?groupId=${req.body.group_id}&groupCreate=success`)
    }
    catch(err){
        console.log(err);
        res.redirect(303, `/landing/view-groups?groupCreate=failure`)
    }
    
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
    try{
        const conn = await connPromise;
        const query = 'update ju_groups set groupName=?,project=? where groupId=?';
        const [results]=await conn.query(query,[req.body.groupName,req.body.project,req.body.groupId])
        res.redirect(`/group/dashboard?groupId=${req.body.groupId}&groupEdit=success`);
    }
    catch(err){
        console.log(err);
        res.redirect(`/group/dashboard?groupId=${req.body.groupId}&groupEdit=failure`);
    }
    
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    try{
        console.log(req.query);
        const conn=await connPromise;
        const query = 'DELETE FROM ju_groups WHERE groupId=?';
        const [results]=await conn.query(query,[req.query.groupId])
        console.log(results);
        res.redirect(`/landing/view-groups?groupDelete=success`);
    }
    catch(err){
        console.log(err);
        res.redirect(`/landing/view-groups?groupDelete=failure`);
    }
    
})

module.exports = router