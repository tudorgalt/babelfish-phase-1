require('dotenv').config()
const mysql = require('mysql2')

module.exports = {
    connect: async function() {
        return new Promise((resolve, reject) => {
            console.log(process.env.SERVER, process.env.USERNAME, process.env.DBNAME, process.env.PASSWORD)
            const con = mysql.createConnection({
                host: process.env.SERVER,
                user: process.env.USERNAME,
                password: process.env.PASSWORD,
                database: process.env.DATABASE
            })
              
            con.connect((err) => {
                if (err) {
                    console.log(err)
                    reject(err)
                    return
                } 
                console.log('Connected')
                resolve(con)
            })
        })
    },

    query: async function(query) {
        const con = await this.connect()
        return new Promise((resolve, reject) => {
            // con.query(query, (err, rows) => {
            //     if(err) {
            //         reject(err)
            //         return
            //     }
            //     console.log('Data received from Db:')
            //     con.end((err) => {
            //         console.log('Gracefull quit')
            //     })
            //     resolve(rows)
            // })
        })
    }
}