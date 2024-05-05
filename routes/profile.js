const express=require('express');
const router=express.Router();
const {connPromise}=require('../dbConnect');
const {upload,checkSessionValid}=require('../middlewares');
const {sendMail}=require('../mailService');
require('dotenv').config()
const ejs=require('ejs')
const bcrypt=require('bcrypt')
const { traffic } = require("cloudflare-r2.js");

router.post("/passwordChange",checkSessionValid,async(req,res)=>{
    try{
        console.log(req.body);
        const conn=await connPromise;
        const [[user]]=await conn.query('SELECT * FROM users where userId=?',[req.session.user.userId]);
        if(await bcrypt.compare(req.body.currentPassword,user.userPassword)){
            newPassword=await bcrypt.hash(req.body.newPassword,10);
            await conn.query('UPDATE users SET userPassword=? where userId=?',[newPassword,user.userId]);
            res.json({
                msg:"success"
            })
        }
        else
            res.json({
                msg:"failure"
            })
    }
    catch(err){
        console.log(err);
        res.json({
            msg:"error"
        })
    }
    
})

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
    const [groups]=await conn.query('SELECT groupId,groupName FROM ju_groups',[]);
    res.render('register',{userIds,groups});
})

router.post('/create',upload.single('profileImage'),async(req,res)=>{
    try{
        // UserID alphanumeric check
        if(!/^[a-zA-Z0-9]+$/.test(req.body.userId))
            throw Error;

        // timestamp calculation
        // Specify the timezone offset in minutes
        const timeZoneOffset = 330; // IST Offset

        // Get the current date and time adjusted for the timezone offset
        const offsetInMilliseconds = timeZoneOffset * 60 * 1000; // Convert minutes to milliseconds
        const adjustedDate = new Date(Date.now() + offsetInMilliseconds)
        const currDateTime=adjustedDate.toISOString().replace('T',' ').split('.')[0];
        
        // Upload File to cloud
        let cloudFile={data:"default.jpg"}
        if(req.file)
        {
            console.log("FILE UPLOADED");
            console.log(req.file);
            // Upload to Cloudflare R2 
            [cloudFile] = await new traffic()
            .bucketName("ju-community") // Your Cloudflare-R2 Bucket Name where you want to upload the image
            .upload([req.file.path]) // Your image path (Must use an array)
            console.log(cloudFile);
        }
        
        // Destructure and stringify object and dynamic fields
        let {userId,username,email,password,roll,department,bio,degree,passout,joinGroup,...dynamicFields}=req.body
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
        degree=JSON.stringify(degree);

        // Salt password
        const passwordHash=await bcrypt.hash(password,10);

        // save to DB
        const conn=await connPromise;
        const query = 'INSERT INTO users(timestamp, userId, userName, userEmail, userPassword, userRoll, userDepartment, bio, profileImage,degree,passout, dynamicFields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [results, fields] = await conn.query(query, 
                                    [currDateTime,
                                    userId, 
                                    username, 
                                    email, 
                                    passwordHash, 
                                    roll, 
                                    department, 
                                    bio, 
                                    process.env.PUBLIC_URL+cloudFile.data,
                                    degree,
                                    passout, 
                                    dynamicFields]);
        await conn.query('INSERT INTO members(groupId,userId) VALUES(?,?)',[joinGroup,userId]);
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
    user['degree']=JSON.parse(user['degree']);
    console.log(user);
    res.render('editProfile',{user})
})

router.post('/edit',checkSessionValid,upload.single('profileImage'),async(req,res)=>{
    try{
        const conn=await connPromise;
        // Destructure object and dynamic fields
        let {userId,username,email,roll,department,degree,passout,bio,...dynamicFields}=req.body
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
        degree=JSON.stringify(degree);

        // Upload new image
        if(req.file)
        {
            // Upload to CloudFlare
            [cloudFile] = await new traffic()
            .bucketName(process.env.BUCKET) // Your Cloudflare-R2 Bucket Name where you want to upload the image
            .upload([req.file.path]) // Your image path (Must use an array)

            console.log(cloudFile);

            await conn.query('UPDATE users SET profileImage=? where userId=?',[process.env.PUBLIC_URL+cloudFile.data,userId])
        }

        // Update DB
        const query = 'UPDATE users SET userName=?, userEmail=?, userRoll=?, userDepartment=?, degree=?, passout=?, bio=?, dynamicFields=? where userId=?';
        const [results] = await conn.query(query, 
        [username, email, roll, department, degree, passout, bio, dynamicFields,userId]);
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

function isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
}

module.exports=router