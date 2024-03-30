const express = require('express');
const router = express.Router();
const { checkSessionValid, checkAdmin } = require('../middlewares');
const { connPromise } = require('../dbConnect');

router.get('/create',checkSessionValid,checkAdmin, (req, res) => {
    console.log(req.query);
    res.render('createResource', {groupId:req.query.groupId});
})

router.post('/create',checkSessionValid,checkAdmin,async(req,res)=>{
    console.log(req.body);
    const conn=await connPromise;
    const query='insert into resources values(?,?,?,?,?)';
    const [results]=await conn.query(query,[
        crypto.randomUUID(),
        req.body.resourceHeading,
        req.body.resourceDescription,
        req.body.resourceLink,
        req.body.groupPostedTo])
    console.log(results);
    res.redirect(303,'/group/dashboard?groupId='+req.body.groupPostedTo);
})


module.exports = router