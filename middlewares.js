const session=require('express-session')
const mySqlStore=require('express-mysql-session')(session)
const {dbOptions,connPromise}=require('./dbConnect')

function checkSessionValid(req,res,next) {
    if(!req.session.valid)
        res.redirect('/');
    else
        next();
}

async function checkAdmin(req,res,next) {
    const conn=await connPromise;
    [results,fields]=await conn.query('select * from ju_groups');
    const admins=results.map((group)=>group.AdminId);
    if(admins.includes(req.session.user.UserId))
    {
        next();
    }
    else
    {
        res.redirect(303,'/');
    }
}

async function checkGroupAdmin(req,res,next){
    console.log(req.query);
    const conn=await connPromise;
    [admin]=await conn.query('select adminId from ju_groups where groupId=?',[req.query.groupId]);
    console.log(admin);
    if(req.session.user.userId==admin[0].adminId)
        next();
    else
        res.redirect(303,'/');
}

async function checkInvitation(req,res,next){
    console.log(req.body);
    const conn=await connPromise;
    [results]=await conn.query('select groupId,inviteTo from invites where inviteId=?',[req.body.inviteId]);
    console.log(results);
    if(results[0].groupId==req.body.groupId && results[0].inviteTo==req.session.user.userId)
        next();
    else
        res.redirect(303,'/');
}

function getSession(){
    const sessionStore=new mySqlStore(dbOptions)
    const newSession=session({
        secret:'MySecret',
        resave:false,
        saveUninitialized:true,
        store:sessionStore,
        cookie: {
            maxAge: 10*60*60*1000
        }
    })
    return newSession;
}


module.exports={checkSessionValid,getSession,checkAdmin,checkGroupAdmin,checkInvitation}