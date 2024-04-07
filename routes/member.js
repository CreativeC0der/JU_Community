const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin ,checkInvitation} = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.post('/create',checkSessionValid,checkInvitation,async(req,res)=>{
    console.log(req.body);
    const conn=await connPromise;
    await conn.query('insert into members(userId,groupId) values(?,?)',[req.session.user.userId,req.body.groupId]);
    await conn.query('delete from invites where inviteId=?',[req.body.inviteId]);
    res.json({result:'invitation sent!!'})
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.query);
    const conn=await connPromise;
    const query = 'DELETE FROM resources WHERE resourceId=?';
    const [results]=await conn.query(query,[req.query.resourceId])
    console.log(results);
    res.redirect(`/group/dashboard?groupId=${req.query.groupId}`);
})

module.exports=router