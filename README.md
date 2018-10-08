# django-forgotten-migrations

GitHub App built with [Probot](https://probot.github.io) that PR checks for forgotten migrations in a Django project.

![PR check example](https://raw.githubusercontent.com/frnhr/django-forgotten-migrations/master/screenshot.png "PR check example")


## Usage

### 1. Add the GitHub app to your repo

> TODO add the app to GitHub Marketplace.

### 2. Add snippet to your CI process

To use django-forgotten-migrations you need to have some CI process set up for your PRs.

CI needs to POST a bit of data to django-forgotten-migrations so that it can create a status check on the PR. To do this, add this script to your project and execute it during CI build process, probably near the end:

```sh
#!/bin/sh

URL="https://forgotten-migrations.tocka.tk/hook/"
HASH=$(git rev-parse HEAD)
CONTENT=$(python manage.py makemigrations --check --dry-run -v2 | tr -d "'")
DATA=$(printf "${HASH}\n${CONTENT}\n")
printf "django-forgotten-migrations\n"
printf "${DATA}\n"
curl -X POST -H "Content-Type: text/plain" --data-raw "${DATA}" ${URL}
printf "\n"
```


## How it works

Two steps...

1. When a new PR is created, GitHub sends a webhook request to django-forgotten-migrations server notifying that a new check needs to happen.
2. django-forgotten-migrations created an "in-progress" status check on the PR to make it visible that a status will be arriving there soon.
3. The PR goes through its usual CI build process (CircleCI, Travis or some such)
4. At the end of the CI build, a Django management command is called (see script above). This is where is actuall check happens. 
5. Immediately after the check, `curl` makes a POST request sending the output of the management command to django-forgotten-migrations server (also in the script above).
6. django-forgotten-migrations recieves the data, and updates the "in-progress" check on the PR to either "success" or "fail", depending on the received data.


### Privacy / security concerns

This app does not have access to any code. You should see this when adding ("installing") the app to your repository:
![permissions screenshot](https://raw.githubusercontent.com/frnhr/django-forgotten-migrations/master/screenshot-permissions.png "permissions screenshot")


however, it might be possible for the app to receive some sensitive data if the Django management command creates an error (the script will send the output to the app). To mitigate this, we recommend adding the script to the end of your CI process (so that if the CI build fails, django-forgotten-migrations will not get any data at all).

#### I can haz spoof your check!

Yes, you can issue a simple POST with the SHA of git command and some message to django-forgotten-migrations. It will accept it and interper it as if it came from GitHub.

I don't think that's a major problem, though. But will look into a mechanism to verifying origin of POST requests to django-forgotten-migrations.

### Why need a CI process?

To determine whether a migration is missing, we are running a Django management command. This requires a fully set up environment for your project. It seems to be an overkill to engeneer that just for one command when most projects already have such environment set up in their CI.

Technically, you don't _need_ a CI for this, you can report data to django-forgotten-migrations by running the script from your project environment locally.

## Running the service yourself

Self-hosting checker is also an option. You will need to create a new GitHub app 

> TODO expand these instructions

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how django-forgotten-migrations could be improved, or want to report a bug, please open an issue! We'd appretiate any and all contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2018 Fran Hrzenjak <fran.hrzenjak@gmail.com> (tocka.tk/django-forgotten-migrations)
