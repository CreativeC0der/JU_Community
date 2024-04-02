const express=require('express');
const router=express.Router();
const {connPromise}=require('../dbConnect');
const {checkSessionValid,checkInvitation}=require('../middlewares');
const multer = require('multer')
const {put}=require('@vercel/blob')

const upload = multer({ storage: multer.memoryStorage() })


router.get('/create',(req,res)=>{
    res.render('reg',{});
})

router.post('/create',upload.single('profileImage'),async(req,res)=>{
    console.log(req.file);
    // Upload to vercel blobs
    const blob=await put(`ProfileImage ${Date.now()} ${req.file.originalname}`,req.file.buffer,{access:'public'})
    console.log(blob);

    // Destructure object and dynamic fields
    let {userId,username,email,password,roll,department,bio,...dynamicFields}=req.body
    dynamicFields=JSON.stringify(dynamicFields)
    console.log(dynamicFields);

    // save to DB
    const conn=await connPromise;
    const query = 'INSERT INTO users(userId, userName, userEmail, userPassword, userRoll, userDepartment, bio, profileImage, dynamicFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [results, fields] = await conn.query(query, 
    [userId, username, email, password, roll, department, bio, blob.url, dynamicFields]);
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