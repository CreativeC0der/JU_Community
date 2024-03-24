const express=require('express');
const router=express.Router();
const {connPromise}=require('../dbConnect');
const {checkSessionValid,checkInvitation}=require('../middlewares');


router.get('/create',(req,res)=>{
    res.render('register',{});
})

router.post('/create',async(req,res)=>{
    const conn=await connPromise;
    const query='insert into users(userName,userEmail,userPassword,userId,userRoll,userDepartment) values(?,?,?,?,?,?)';
    const [results,fields]=await conn.query(query,Object.values(req.body));
    console.log(results);
    res.redirect('/');
})

router.post('/joinGroup',checkSessionValid,checkInvitation,async(req,res)=>{
    console.log(req.body);
    const conn=await connPromise;
    await conn.query('insert into members(userId,groupId) values(?,?)',[req.session.user.userId,req.body.groupId]);
    await conn.query('delete from invites where inviteId=?',[req.body.inviteId]);
    res.json({result:'invitation sent!!'})
})

module.exports=router