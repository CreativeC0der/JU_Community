const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin ,checkInvitation} = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.post('/add',checkSessionValid,checkAdmin,async(req,res)=>{
    console.log(req.body);
    const conn = await connPromise;
    const query='insert into members(userId,groupId) values (?,?)'
    for(user of req.body.users)
        await conn.query(query,[user,req.body.groupId])
    res.json({ response: 'Job done!!!' })
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.query);
    const conn=await connPromise;
    const query = 'DELETE FROM members WHERE userId=? and groupId=?';
    const [results]=await conn.query(query,[req.query.userId,req.query.groupId])
    console.log(results);
    res.redirect(`/group/dashboard?groupId=${req.query.groupId}`);
})

module.exports=router