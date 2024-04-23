const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');
const {sendMail}=require('../mailService')
const ejs=require('ejs');
const { MulterError } = require('multer');

router.get('/panel',checkSessionValid,checkAdmin,async (req,res)=>{
    const conn = await connPromise;
    const query = 'SELECT * FROM users INNER JOIN members ON users.userId=members.userId WHERE approved=0 ORDER BY timestamp DESC';
    const [users]=await conn.query(query,[req.query.groupId])
    users.map((user)=>{
        user['dynamicFields']=JSON.parse(user['dynamicFields'])
        return user;
    })
    res.render('adminPanel',{users,query:req.query});
})

router.get('/approve/:userId',checkSessionValid,checkAdmin,async (req,res)=>{
    try{
        console.log(req.params.userId);
        const conn = await connPromise;
        let query = 'UPDATE users SET approved=1 WHERE userId=?';
        const [results]=await conn.query(query,[req.params.userId]);
        console.log(results);
        query = 'SELECT * FROM users where userId=?';
        const [[user]]=await conn.query(query,[req.params.userId]);
        console.log(user);
        ejs.renderFile(process.cwd()+'/views/pages/userMail.ejs',{status:'Approved',name:user.userName,userId:user.userId},(err,html)=>{
            sendMail(user.userEmail,'JU Community Notification',html);
        })
        res.redirect('/admin/panel?approval=success');
    }
    catch(err){
        console.log(err);
        res.redirect('/admin/panel?approval=failure');
    }
    
})

router.get('/deny/:userId',checkSessionValid,checkAdmin,async (req,res)=>{
    try{
        const conn = await connPromise;
        let query = 'SELECT * FROM users where userId=?';
        const [[user]]=await conn.query(query,[req.params.userId]);

        query = 'DELETE FROM users WHERE userId=?';
        const [results]=await conn.query(query,[req.params.userId]);
        ejs.renderFile(process.cwd()+'/views/pages/userMail.ejs',{status:'Denied',name:user.userName},(err,html)=>{
            sendMail(user.userEmail,'JU Community Notification',html);
        })
        res.redirect('/admin/panel?approval=success');
    }
    catch(err){
        console.log(err);
        res.redirect('/admin/panel?approval=failure');
    }
})


module.exports=router;