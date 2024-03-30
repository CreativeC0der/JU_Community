const mysql=require('mysql2/promise')
require('dotenv').config()

// const dbOptions={
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DATABASE
// }

const dbOptions={
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'community'
}

connPromise=mysql.createConnection(dbOptions);

module.exports={
    dbOptions,
    connPromise
}   
