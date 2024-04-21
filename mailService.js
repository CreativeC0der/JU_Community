require('dotenv').config()
const nodemailer=require('nodemailer')
const ejs=require('ejs')

function sendMail(recipient,subject,html){
  console.log('MAIL DETAILS');
  console.log(html);
    var transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user:process.env.MAIL_ID,
            pass:process.env.MAIL_PASS
        }
    });
    const mailOptions = {
        from: process.env.MAIL_ID, // Sender address
        to: recipient, // List of recipients
        subject: subject, // Subject line
        html:html
   };

   return transport.sendMail(mailOptions);
}

module.exports= {sendMail}