const Reports = require('./reports')
const checker = require('./checker')
const bodyParser = require('body-parser')

const getHandler = (request, response) => {
  response
    .set('Content-Type', 'text/plain')
    .send(`hello :p`)
}

const postHandler = async (request, response) => {
  const { hash, content } = Reports.parse(request.body)
  await new Reports().create(hash, content)
  response
    .set('Content-Type', 'text/plain')
    .status(201)
    .send(`created: ${hash}`)
}

const prHandler = async (context) => {
  const pr = context.payload.pull_request
  const hash = context.payload.pull_request.head.sha
  const ref = context.payload.pull_request.head.ref
  context.log.info(`Handling ${context.event}.${context.payload.action} for ${hash} "${ref}"`)
  checker.createFromPr('waiting', context)
  waitForReport(context, hash)
    .then(({ context, report }) => {
      if (Reports.check(report.content)) {
        checker.createFromPr('success', context)
      } else {
        checker.createFromPr('failure', context, report.content)
      }
    })
    .catch((err) => {
      context.log.warn(`Failure with ${pr.head.sha}: ${err}`)
      if (err.message === 'timeout') {
        checker.createFromPr('timeout', context)
      } else {
        checker.createFromPr('unexpected', context)
      }
    })
}

const waitForReport = (context, hash) => new Promise((resolve, reject) => {
  let counter = 0
  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const TIMEOUT = 20 * MINUTE
  const INTERVAL = 6 * SECOND

  const checkReport = async () => {
    const reports = new Reports()
    const report = await reports.get(hash)
    if (report) {
      resolve({ context, report })
    } else if (++counter * INTERVAL > TIMEOUT) {
      reject(new Error('timeout'))
    } else {
      setTimeout(checkReport, INTERVAL)
    }
    reports.dispose()
  }
  // noinspection JSIgnoredPromiseFromCall
  checkReport()
})

const rerequestHandler = async (context) => {
  const hash = context.payload.check_run.head_sha
  checker.updateFromCheckRun('waiting', context)
  waitForReport(context, hash)
    .then(({ context, report }) => {
      if (Reports.check(report.content)) {
        checker.updateFromCheckRun('success', context)
      } else {
        checker.updateFromCheckRun('failure', context)
      }
    })
    .catch((err) => {
      context.log.warn(`Failure with ${hash}: ${err}`)
      if (err.message === 'timeout') {
        checker.updateFromCheckRun('timeout', context)
      } else {
        checker.updateFromCheckRun('unexpected', context)
      }
    })
}

module.exports = async (app) => {
  app.route('/hook')
    .use(bodyParser.text())
    .post('/', postHandler)
    .get('/', getHandler)
  app.on(['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'], prHandler)
  app.on(['check_run.rerequested'], rerequestHandler)
}
