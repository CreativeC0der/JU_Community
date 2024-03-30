const mysql=require('mysql2/promise')
require('dotenv').config()

const dbOptions={
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE
}

connPromise=mysql.createConnection(dbOptions);

module.exports={
    dbOptions,
    connPromise
}   
