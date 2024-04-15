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


router.get('/create',(req,res)=>{
    res.render('register',{});
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
        dynamicFields=JSON.stringify(dynamicFields)
        console.log(dynamicFields);

        // save to DB
        const conn=await connPromise;
        const query = 'INSERT INTO users(timestamp, userId, userName, userEmail, userPassword, userRoll, userDepartment, bio, profileImage,degree,passout, dynamicFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [results, fields] = await conn.query(query, 
                                    [currDate,
                                    userId, 
                                    username, 
                                    email, 
                                    password, 
                                    roll, 
                                    department, 
                                    bio, 
                                    blob.url,
                                    degree,
                                    passout, 
                                    dynamicFields]);
        console.log(req.body);
        ejs.renderFile(process.cwd()+'/views/pages/adminMail.ejs',req.body,(err,html)=>{
            if(err)
                console.log(err);
            else
                sendMail(process.env.ADMIN_MAIL,'New Registration',html);
        })
        res.redirect('/?registraion=success');
    }
    catch(err){
        console.log(err.message);
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
        console.log('RECEIVED BODY');
        console.log(req.body);
        // Destructure object and dynamic fields
        let {userId,username,email,password,roll,department,degree,passout,bio,...dynamicFields}=req.body
        dynamicFields=JSON.stringify(dynamicFields)

        if(req.file)
        {
            // Upload to vercel blobs
            const blob=await put(`ProfileImage ${Date.now()} ${req.file.originalname}`,req.file.buffer,{access:'public'})
            console.log(blob);
            await conn.query('UPDATE users SET profileImage=? where userId=?',[blob.url,userId])
        }

        const query = 'UPDATE users SET userName=?, userEmail=?, userPassword=?, userRoll=?, userDepartment=?, degree=?, passout=?, bio=?, dynamicFields=? where userId=?';
        const [results] = await conn.query(query, 
        [username, email, password, roll, department, degree, passout, bio, dynamicFields,userId]);
        console.log(results);
        res.redirect('/landing/my-profile?editProfile=success');
    }
    catch(err)
    {
        console.log(err);
        res.redirect('/landing/my-profile?editProfile=failure');
    }
    
})

router.get('/delete',checkSessionValid,async (req,res)=>{
    await del(req.session.user.profileImage)
    const conn=await connPromise;
    const query = 'DELETE FROM users WHERE userId=?';
    const [results]=await conn.query(query,[req.session.user.userId])
    console.log(results);
    res.redirect(`/logout`);
})



module.exports=router