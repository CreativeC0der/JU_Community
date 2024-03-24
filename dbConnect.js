const mysql=require('mysql2/promise')

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
