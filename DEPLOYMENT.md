# Production deployment with GitHub + self-hosted runner

This project is currently built around MongoDB + Mongoose. The deployment workflow below is the correct pattern for a self-hosted GitHub runner, but the database secret must match the app's actual database type.

## Required GitHub repository secrets

Set these in the GitHub repository under Settings -> Secrets and variables -> Actions:

- `MONGO_URI` for the current MongoDB setup
- `JWT_SECRET`
- `URL`
- `EMAIL_USER`
- `EMAIL_PASS`

If you later migrate the app to RDS MySQL, replace `MONGO_URI` with the MySQL values and update the backend DB layer as well:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

## Self-hosted runner note

The workflow uses `runs-on: self-hosted`, so the runner must already be registered in GitHub and should be installed on the same machine or VM where you want the Node app to run.

## Production flow

1. Push code to `main`
2. GitHub Actions runs on the self-hosted runner
3. Backend and frontend dependencies are installed
4. Frontend is built
5. The backend `.env` file is created from GitHub secrets
6. The app is started with `nohup node server.js`
7. The workflow checks `/` at `http://localhost:5000`

## If you plan to use RDS MySQL

The current repo still contains Mongoose models and controllers. A real MySQL migration requires a full backend rewrite, not only env changes. The deployment pipeline can still be used after the app is migrated, but the actual database calls and connection logic must also be updated.

## Useful commands on the runner

```bash
# check app status
ps -ef | grep server.js

# view logs
cat /tmp/order_backend.log

# stop app
kill $(cat /tmp/order_backend.pid)
```
