const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin ,checkInvitation} = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.post('/add',checkSessionValid,checkAdmin,async(req,res)=>{
    try{
        const conn = await connPromise;
        const query='insert into members(userId,groupId) values (?,?)'
        for(user of req.body.users)
            await conn.query(query,[user,req.body.groupId])
        res.json({ success:true })
    }
    catch(err){
        console.log(err);
        res.json({ success:false })
    }
    
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    try{
        const conn=await connPromise;
        const query = 'DELETE FROM members WHERE userId=? and groupId=?';
        const [results]=await conn.query(query,[req.query.userId,req.query.groupId])
        console.log(results);
        res.redirect(`/group/dashboard?groupId=${req.query.groupId}&memberDelete=success`);
    }
    catch(err){
        console.log(err);
        res.redirect(`/group/dashboard?groupId=${req.query.groupId}&memberDelete=failure`);
    }
    
})

module.exports=router