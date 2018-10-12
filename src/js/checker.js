const status = {
  waiting: () => ({
    status: 'queued',
    output: {
      title: 'waiting',
      summary: 'Waiting for webhook report from CI.'
    }
  }),
  success: () => ({
    status: 'completed',
    conclusion: 'success',
    completed_at: new Date(),
    output: {
      title: 'OK',
      summary: 'There are no forgotten migrations!'
    }
  }),
  timeout: () => ({
    status: 'completed',
    conclusion: 'timed_out',
    completed_at: new Date(),
    output: {
      title: 'Timeout',
      summary: 'Giving up.'
    }
  }),
  failure: (content) => ({
    status: 'completed',
    conclusion: 'failure',
    completed_at: new Date(),
    output: {
      title: 'Missing migrations detected!',
      summary: `Django wants to create migrations:\n${content}`
    }
  }),
  unexpected: () => ({
    status: 'completed',
    conclusion: 'failure',
    completed_at: new Date(),
    output: {
      title: 'Unexpected error',
      summary: 'Error while running the check.'
    }
  })
}

module.exports.createFromPr = (key, context, ...rest) => {
  context.log.debug('createFromPr', key)
  const commonArgs = {
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
  }
  const args = Object.assign({}, commonArgs, status[key](...rest))
  context.github.checks.create(context.repo(args))
  context.log.debug('createFromPr', key, 'DONE')
}

module.exports.updateFromCheckRun = (key, context, ...rest) => {
  context.log.debug('updateFromCheckRun', key)
  const commonArgs = {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    check_run_id: context.payload.check_run.id,
  }
  const args = Object.assign({}, commonArgs, status[key](...rest))
  context.github.checks.update(context.repo(args))
  context.log.debug('updateFromCheckRun', key, 'DONE')
}

module.exports.updateFromCheckSuite = (key, context, checkRunId, ...rest) => {
  context.log.debug('updateFromCheckSuite', key)
  const commonArgs = {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    check_run_id: checkRunId
  }
  const args = Object.assign({}, commonArgs, status[key](...rest))
  context.github.checks.update(context.repo(args))
  context.log.debug('updateFromCheckSuite', key, 'DONE')
}
