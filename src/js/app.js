const Report = require('./reports')
const PullRequest = require('./pullrequests')
const checker = require('./checker')
const bodyParser = require('body-parser')

const getHandler = (request, response) => {
  response
    .set('Content-Type', 'text/plain')
    .send(`hello :p`)
}

const postHandler = async (request, response) => {
  const { hash, content } = Report.parse(request.body)
  await new Report().create(hash, content)
  response
    .set('Content-Type', 'text/plain')
    .status(201)
    .send(`created: ${hash}`)
}

const prHandler = async (context) => {
  const pr = context.payload.pull_request
  context.log.info(`Handling ${context.event}.${context.payload.action} for ${pr.head.sha} "${pr.head.ref}"`)
  checker.create('waiting', context)
  processPr(context)
    .then(({ context, report }) => {
      if (Report.check(report.content)) {
        checker.create('success', context)
      } else {
        checker.create('failure', context, report.content)
      }
    })
    .catch((err) => {
      context.log.warn(`Failure with ${pr.head.sha}: ${err}`)
      if (err.message === 'timeout') {
        checker.create('timeout', context)
      } else {
        checker.create('unexpected', context)
      }
    })
}

const processPr = (context) => new Promise((resolve, reject) => {
  let counter = 0
  const SECOND = 1000
  const MAX = 60 * SECOND
  const INTERVAL = 6 * SECOND

  const checkReport = async () => {
    const report = new Report()
    const prReport = await report.get(context.payload.pull_request.head.sha)
    if (prReport) {
      resolve({ context, report: prReport })
    } else if (++counter * INTERVAL > MAX) {
      reject(new Error('timeout'))
    } else {
      setTimeout(checkReport, INTERVAL)
    }
    report.dispose()
  }
  // noinspection JSIgnoredPromiseFromCall
  checkReport()
})

module.exports = async (app) => {
  app.route('/hook')
    .use(bodyParser.text())
    .post('/', postHandler)
    .get('/', getHandler)
  app.on(['pull_request.opened', 'pull_request.reopened'], prHandler)
}
