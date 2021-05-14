# dependabot-merge-action-app

Fastify application to automatically approve and merge Dependabot pull requests.

## Usage

- install the GitHub App [dependabot-merge-action](https://github.com/apps/dependabot-merge-action) on the repositories or the organization where you want to use the action
- use [github-action-merge-dependabot](https://github.com/fastify/github-action-merge-dependabot) in your GitHub action workflow

## Overview

This application is a companion to the GitHub action [github-action-merge-dependabot](https://github.com/fastify/github-action-merge-dependabot).

When used in a GitHub workflow, the action invokes this application to delegate approval and merging of the pull request.

The reason why an external application is needed to automate this is because since [this change](https://github.blog/changelog/2021-02-19-github-actions-workflows-triggered-by-dependabot-prs-will-run-with-read-only-permissions/):

1. the `GITHUB_SECRET` token provided in all workflows has readonly permissions, preventing the action itself from approving and merging the pull request
2. no other secrets are provided to the workflow even if configured in the repository, preventing any other approaches relying on personal access tokens or others

## How it works

- [dependabot-merge-action](https://github.com/apps/dependabot-merge-action) GitHub app is installed on the target repository
- this Fastify application runs with the credentials of that GitHub App, which gives it access to the repository
- [github-action-merge-dependabot](https://github.com/fastify/github-action-merge-dependabot) GitHub action is used in a workflow and it delegates to this app the responsibility of approving and merging the pull request using a HTTP request
- the action provides the `GITHUB_TOKEN` secret to the Fastify application as the authentication token
- the Fastify application uses the token to infer which repository is being targeted, thereby preventing misuse
- after the Fastify application has verified that the provided token has access to the target repository, it uses its own credentials to approve and merge the pull request

## Security

The approach used by this mechanism is secure with some caveats.

- it gets a token that, because of GitHub limitations, is a readonly token
- it uses the token that's scoped to the repository and is valid for the duration of the workflow execution to infer which repository to target to prevent anybody from sending a malicious request
- it trades a readonly token to a write operation (approve and merge)

By its very nature this approach cann't be 100% secure because a readonly permission is turned into a write permission. On the other hand:

- the GitHub app requests only the minimum level of permissions neded to approve and merge pull requests
- the Fastify application only approves and merges Dependabot pull requests

Therefore, the worst that can happen is that:

- somebody has a readonly token for your repository
- it invokes the Fastify application's HTTP API with that token to merge a Dependabot PR whose merge requirements are satisfied

If you make sure that PR merge permissions require:

- at least one review
- a passing build (required status checks)

Then this mechanism can do little to no harm, in the worst case merging a Dependabot PR you didn't intend to merge.

## How to deploy

- Prerequisites: a GCP project with the [cloud run and cloud build apis enabled](https://cloud.google.com/apis/docs/getting-started)
- Create a service account in the IAM & Admin console to be used to deploy the app 
- Create a key for the service account, this key will be configured as a secret in the GitHub actions to be able to deploy the app
- For the service account, [grant the permissions "Service Account User", "Cloud Run Admin", "Storage Admin"](https://github.com/google-github-actions/deploy-cloudrun) and "Cloud Build Service Account", this last permission is necessary since cloud build will be used to build the image based in the source code directly
- Configure the secrets for: `GCP_PROJECT_ID`, `GCP_CLOUDRUN_SERVICE_NAME`, `GCP_CLOUDRUN_SERVICE_REGION`, `GCP_SA_EMAIL`, `GCP_SA_KEY`, `API_ID` and `PRIVATE_KEY`
- After these steps above are configured, run the workflow