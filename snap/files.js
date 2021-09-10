const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports = {
    rows: [],

    saveJson: async function(object, path) {
        const str = JSON.stringify(object)
        await fs.promises.writeFile(path, str)
    },

    readJson: async function(path) {
        const str = await fs.promises.readFile(path)
        return JSON.parse(str)
    },

    saveCsv: async function(list, path) {
        const header = Object.keys(list[0]).map(k => {
            return {id: k, title: k}
        })
        const csvWriter = createCsvWriter({
            path: path,
            header: header
          });
        await csvWriter.writeRecords(list)
    },

    readCsv: function(path) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(path)
            const list = stream.pipe(csv())
            this.rows = []
            list.on('data', (row) => {
                this.rows.push(row)
            })
        
            list.on('end', () => {
                resolve(this.rows)
            })
        })
    }
}