const status = {
  waiting: (context) => ({
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
    status: 'queued',
    output: {
      title: 'waiting',
      summary: 'Waiting for webhook report from CI.'
    }
  }),
  success: (context) => ({
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
    status: 'completed',
    conclusion: 'success',
    completed_at: new Date(),
    output: {
      title: 'OK',
      summary: 'There are no forgotten migrations!'
    }
  }),
  timeout: (context) => ({
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
    status: 'completed',
    conclusion: 'timed_out',
    completed_at: new Date(),
    output: {
      title: 'Timeout',
      summary: 'Giving up.'
    }
  }),
  failure: (context, content) => ({
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
    status: 'completed',
    conclusion: 'failure',
    completed_at: new Date(),
    output: {
      title: 'Missing migrations detected!',
      summary: `Django wants to create migrations:\n${content}`
    }
  }),
  unexpected: (context) => ({
    name: 'Forgotten Migrations',
    head_branch: context.payload.pull_request.head.ref,
    head_sha: context.payload.pull_request.head.sha,
    status: 'completed',
    conclusion: 'failed',
    completed_at: new Date(),
    output: {
      title: 'Unexpected error',
      summary: 'Error while running the check.'
    }
  })
}

module.exports.create = (key, context, ...rest) => {
  return context.github.checks.create(context.repo(status[key](context, ...rest)))
}
