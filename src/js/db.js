const sqlite3 = require('sqlite3')

const SCHEMA = [
  `
  CREATE TABLE IF NOT EXISTS pr
  (
    hash VARCHAR(100) NOT NULL
      PRIMARY KEY,
    timestamp DATETIME NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS report
  (
    hash VARCHAR(100) NOT NULL
      PRIMARY KEY,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT 0 NOT NULL
  )
  `
]

module.exports.Table = class Table {
  constructor (table, unquotedFields = []) {
    this._table = table
    this._unquotedFields = unquotedFields
    this.db = new sqlite3.Database('./var/db.sqlite3', (err) => {
      if (err) throw err
    })
  }

  async init () {
    return Promise.all(
      SCHEMA.map(sql => new Promise((resolve, reject) => {
        this.db.run(sql, [], (err) => {
          if (err) reject(err)
          else resolve()
        })
      }))
    )
  }

  _quote (field, value) {
    if (field in this._unquotedFields) {
      return String(value)
    } else {
      return `'${String(value).replace("'", "\\'")}'`
    }
  }

  async all () {
    const sql = `SELECT * FROM ${this._table}`
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async create (args) {
    let fields = []
    let values = []
    for (const key in args) {
      fields.push(key)
      values.push(this._quote(key, args[key]))
    }
    const sql = `INSERT OR REPLACE INTO ${this._table} (${fields.join(', ')}) VALUES (${values.join(', ')})`
    console.debug(sql)
    return new Promise((resolve, reject) => {
      this.db.run(sql, [], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async get (args) {
    let field, value
    for (const key in args) {
      [ field, value ] = [ key, this._quote(key, args[key]) ]
      break
    }
    const sql = `SELECT * FROM ${this._table} WHERE ${field}=${value} LIMIT 1`
    console.debug(sql)
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], async (err, rows) => {
        if (err) reject(err)
        else resolve(rows.length ? rows[0] : null)
      })
    })
  }

  async close () {
    return new Promise((resolve) => {
      this.db.close()
      resolve()
    })
  }
}
