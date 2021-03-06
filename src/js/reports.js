const db = require('./db')

const NO_CHANGES = 'No changes detected'

module.exports = class Reports {
  constructor () {
    this._table = new db.Table('report')
  }

  async get (hash) {
    await this._table.init()
    return this._table.get({ hash })
  }

  async create (hash, content) {
    await this._table.init()
    const timestamp = Math.round(new Date().getTime() / 1000)
    this._table.delete({ hash })
    return this._table.create({ hash, content, timestamp })
  }

  async delete (hash) {
    await this._table.init()
    await this._table.delete({ hash })
  }

  dispose () {
    this._table.close()
  }

  static parse (payload) {
    const index = payload.indexOf('\n')
    const hash = payload.substring(0, index)
    const content = payload.substring(index + 1)
    if (!hash || !payload) throw new Error('Invalid payload')
    return { hash, content }
  }

  static check (content) {
    return content.indexOf(NO_CHANGES) === 0
  }
}
