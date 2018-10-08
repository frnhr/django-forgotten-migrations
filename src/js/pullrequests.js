const db = require('./db')

module.exports = class PullRequest {

  constructor () {
    this._table = new db.Table('pr')
  }

  async create (hash) {
    await this._table.init()
    const timestamp = Math.round(new Date().getTime() / 1000)
    return this._table.create({ hash, timestamp })
  }

  async get (hash) {
    await this._table.init()
    return this._table.get({ hash })
  }

  cleanup () {
    throw new Error('Not implemented')
  }
}
