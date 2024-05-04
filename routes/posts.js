const express = require('express');
const router = express.Router();
const { upload,checkGroupMember,checkPostUser,checkSessionValid} = require('../middlewares');
const { connPromise } = require('../dbConnect');
const {R2, traffic}=require('cloudflare-r2.js');

router.get('/create', checkSessionValid,checkGroupMember, async (req, res) => {
  res.render('createPost', {
    groupId: req.query.groupId,
    currUser:req.session.user
  });
})

router.post('/create', checkSessionValid, upload.single('postImage'), async (req, res) => {
  try{
    let currDate = new Date().toISOString().replace('T', ' ').split('.')[0];
    
    [cloudFile]=await new traffic()
    .bucketName(process.env.BUCKET)
    .upload([req.file.path]);
    console.log(cloudFile);

    const conn = await connPromise;
    const query='insert into posts(timestamp,postId,postHeading,postContent,postImage,groupId,userId) values(?,?,?,?,?,?,?)';
    const [results] = await conn.query(query,
                          [currDate,
                          crypto.randomUUID(), 
                          req.body.postHeading, 
                          req.body.postContent, 
                          process.env.PUBLIC_URL+cloudFile.data, 
                          req.body.groupId,
                          req.session.user.userId])
    res.redirect(303, `/group/dashboard?groupId=${req.body.groupId}&postCreate=success`);
  }
  catch(err){
    console.log(err);
    res.redirect(303, `/group/dashboard?groupId=${req.body.groupId}&postCreate=failure`);
  }
  
})

router.get('/edit',checkSessionValid,checkPostUser ,async(req,res)=>{
  console.log(req.query.postId);
  const conn = await connPromise;
  const query = 'select * from posts where postId=?';
  const [[post]]=await conn.query(query,[req.query.postId])
  console.log(post);
  res.render('editPost',{post});
})

router.post('/edit',checkSessionValid,checkPostUser,upload.single('postImage'),async(req,res)=>{
  try{
    const conn=await connPromise;
    if(req.file)
    {
        // Upload to CloudFlare
        [cloudFile]= await new traffic()
        .bucketName(process.env.BUCKET)
        .upload([req.file.path])
        console.log(cloudFile);
        await conn.query('UPDATE posts SET postImage=? where postId=?',[process.env.PUBLIC_URL+cloudFile.data,req.body.postId])
    }

    const query = 'UPDATE posts SET postHeading=?, postContent=? where postId=?';
    const [results] = await conn.query(query, 
                      [req.body.postHeading,
                      req.body.postContent,
                      req.body.postId]);
    console.log(results);
    res.redirect(`/group/dashboard?groupId=${req.body.groupId}&postEdit=success`);
  }
  catch(err){
    console.log(err);
    res.redirect(`/group/dashboard?groupId=${req.body.groupId}&postEdit=failure`);
  }
  
})

router.get('/delete',checkSessionValid,checkPostUser,async (req,res)=>{
  try{
    const conn=await connPromise;
    const query = 'DELETE FROM posts WHERE postId=?';
    const [results]=await conn.query(query,[req.query.postId])
    res.redirect(`/group/dashboard?groupId=${req.query.groupId}&postDelete=success`);
  }
  catch(err){
    console.log(err);
    res.redirect(`/group/dashboard?groupId=${req.query.groupId}&postDelete=failure`);
  }
  
})

module.exports = router