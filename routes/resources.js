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

router.get('/edit',checkSessionValid,checkAdmin,async(req,res)=>{
    const conn=await connPromise;
    const query='select * from resources where resourceId=?';
    const [[resource]]=await conn.query(query,[req.query.resourceId])
    console.log('RESOURCE=------');
    console.log(resource);
    res.render('editResource',{resource})
})


router.post('/edit',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.body);
    const conn = await connPromise;
    const query = 'update resources set resourceHeading=?,resourceDescription=?,resourceLink=? where resourceId=?';
    const [results]=await conn.query(query,
        [req.body.resourceHeading,
        req.body.resourceDescription,
        req.body.resourceLink,
        req.body.resourceId])
    res.redirect(`/group/dashboard?groupId=${req.body.groupPostedTo}`);
})

router.get('/delete',checkSessionValid,checkAdmin,async (req,res)=>{
    console.log(req.query);
    const conn=await connPromise;
    const query = 'DELETE FROM resources WHERE resourceId=?';
    const [results]=await conn.query(query,[req.query.resourceId])
    console.log(results);
    res.redirect(`/group/dashboard?groupId=${req.query.groupId}`);
})
  


module.exports = router