const mysql=require('mysql2/promise')

const dbOptions={
    host: 'mysql-shrijon-ju-community.a.aivencloud.com',
    port: 10552,
    user: 'avnadmin',
    password: 'AVNS_FhBXaC27t_z4uJOW9Cr',
    database: 'defaultdb'
}

connPromise=mysql.createConnection(dbOptions);

module.exports={
    dbOptions,
    connPromise
}   
