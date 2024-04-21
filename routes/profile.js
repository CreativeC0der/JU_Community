const express=require('express');
const router=express.Router();
const {connPromise}=require('../dbConnect');
const {checkSessionValid,checkInvitation}=require('../middlewares');
const multer = require('multer')
const {del,put}=require('@vercel/blob')
const upload = multer({ storage: multer.memoryStorage() })
const {sendMail}=require('../mailService');
require('dotenv').config()
const ejs=require('ejs')
const bcrypt=require('bcrypt')

router.get('/passwordReset',async (req,res)=>{
    try{
        const conn=await connPromise;
        const [[user]]=await conn.query('SELECT * FROM users where userId=?',[req.query.userId]);
        if(user)
        {
            const newPass=crypto.randomUUID();
            const newPassHash=await bcrypt.hash(newPass,10);
            const [results]=await conn.query('UPDATE users SET userPassword=? where userId=?',[newPassHash,req.query.userId])
            html=await ejs.renderFile(process.cwd()+'/views/pages/passwordResetMail.ejs',{userId:user.userId,newPass});
            info=await sendMail(user.userEmail,'Password Reset Request',html);
            console.log(info);
            res.json({reset:'valid'});
        }
        else{
            res.json({reset:'invalid'})
        }
    }
    catch(err){
        console.log(err);
        res.json({reset:'failed'})
    }
    
})

router.get('/create',async(req,res)=>{
    const conn=await connPromise;
    const [users]=await conn.query('SELECT LOWER(userId) as userId FROM users',[]);
    const userIds=users.map(user=>user.userId);
    console.log(userIds);
    res.render('register',{userIds});
})

router.post('/create',upload.single('profileImage'),async(req,res)=>{
    try{
        let currDate = new Date().toISOString().replace('T', ' ').split('.')[0];
        let blob={url:null};
        if(req.file)
        {
            // Upload to vercel blobs
            blob=await put(`ProfileImage ${Date.now()} ${req.file.originalname}`,req.file.buffer,{access:'public'})
            console.log(blob);
        }
        
        // Destructure object and dynamic fields
        let {userId,username,email,password,roll,department,bio,degree,passout,...dynamicFields}=req.body
        dfArr=[]
        for(key in dynamicFields)
        {
            if(Number(key))
                dfArr.push({
                    index:key,
                    field:dynamicFields[key],
                    value:dynamicFields[`value${key}`]
                })
        }
        dynamicFields=JSON.stringify(dfArr);

        // Salt password
        const passwordHash=await bcrypt.hash(password,10);
        console.log(passwordHash);

        // save to DB
        const conn=await connPromise;
        const query = 'INSERT INTO users(timestamp, userId, userName, userEmail, userPassword, userRoll, userDepartment, bio, profileImage,degree,passout, dynamicFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [results, fields] = await conn.query(query, 
                                    [currDate,
                                    userId, 
                                    username, 
                                    email, 
                                    passwordHash, 
                                    roll, 
                                    department, 
                                    bio, 
                                    blob.url,
                                    degree,
                                    passout, 
                                    dynamicFields]);
        ejs.renderFile(process.cwd()+'/views/pages/adminMail.ejs',req.body,async (err,html)=>{
            await sendMail(process.env.ADMIN_MAIL,'New Registration',html);
        })
        res.redirect('/?registration=success');
    }
    catch(err){
        console.log(err);
        res.redirect(303,'/?registration=failure');
    }
})

router.get('/edit',checkSessionValid,async (req,res)=>{
    const conn=await connPromise;
    const query='select * from users where userId=?'
    const [[user]]=await conn.query(query,[req.session.user.userId])
    user['dynamicFields']=JSON.parse(user['dynamicFields'])
    console.log(user);
    res.render('editProfile',{user})
})

router.post('/edit',checkSessionValid,upload.single('profileImage'),async(req,res)=>{
    try{
        const conn=await connPromise;

        // Destructure object and dynamic fields
        let {userId,username,email,password,roll,department,degree,passout,bio,...dynamicFields}=req.body

        dfArr=[]
        for(key in dynamicFields)
        {
            if(Number(key))
                dfArr.push({
                    field:dynamicFields[key],
                    value:dynamicFields[`value${key}`]
                })
        }

        dynamicFields=JSON.stringify(dfArr);

        // Upload new image
        if(req.file)
        {
            // Upload to vercel blobs
            const blob=await put(`ProfileImage ${Date.now()} ${req.file.originalname}`,req.file.buffer,{access:'public'})
            console.log(blob);
            await conn.query('UPDATE users SET profileImage=? where userId=?',[blob.url,userId])
        }

        // Salt password
        const passwordHash=await bcrypt.hash(password,10);

        // Update DB
        const query = 'UPDATE users SET userName=?, userEmail=?, userPassword=?, userRoll=?, userDepartment=?, degree=?, passout=?, bio=?, dynamicFields=? where userId=?';
        const [results] = await conn.query(query, 
        [username, email, passwordHash, roll, department, degree, passout, bio, dynamicFields,userId]);
        console.log(results);
        res.redirect('/landing/my-profile?editProfile=success');
    }
    catch(err){
        console.log(err);
        res.redirect('/landing/my-profile?editProfile=failure');
    }
})

router.get('/delete',checkSessionValid,async (req,res)=>{
    try{
        await del(req.session.user.profileImage)
        const conn=await connPromise;
        const query = 'DELETE FROM users WHERE userId=?';
        const [results]=await conn.query(query,[req.session.user.userId])
        console.log(results);
        res.redirect(`/logout`);
    }
    catch(err){
        console.log(err);
        res.redirect(`/logout`);
    }
    
})

module.exports=router