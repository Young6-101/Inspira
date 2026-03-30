# Cloud Demo Runbook

This repo is currently set up for the shortest path to a cloud demo:
- Backend: FastAPI on AWS Lambda behind API Gateway via AWS SAM
- Frontend: Vite static app on AWS Amplify Hosting

## 1. Install tools

Install the AWS CLI and AWS SAM CLI, then verify them:

```bash
aws --version
sam --version
```

Official install docs:
- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- AWS SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

## 2. Configure AWS credentials

Use the AWS CLI v2 sign-in flow or configured credentials with permissions for Lambda, API Gateway, CloudFormation, IAM, and S3:

```bash
aws login --profile inspira-dev
aws sts get-caller-identity --profile inspira-dev
```

## 3. Deploy backend

From `backend/`:

```bash
sam build
sam deploy --guided --profile inspira-dev
```

Suggested guided values:
- Stack name: `inspira-backend`
- Region: `ap-southeast-1`
- `GeminiApiKey`: your Gemini API key
- Confirm changeset: `Y`
- Save arguments: `Y`

After deploy, copy the `ApiUrl` output.

## 4. Deploy frontend

From `frontend/`:

```bash
npm install
cp .env.cloud.example .env.production
npm run build
cd dist
zip -r ../inspira-frontend.zip .
```

For the fastest demo, create an Amplify app and deploy `inspira-frontend.zip` with "Deploy without Git" -> "Drag and drop".

Set frontend env values before build:
- `VITE_API_URL=<ApiUrl from backend>`
- `VITE_SKIP_AUTH=true`

If you want authentication later, set `VITE_SKIP_AUTH=false` and wire Cognito JWT authorizer into API Gateway.

Gemini API docs:
- API key setup: https://ai.google.dev/gemini-api/docs/api-key
- Python SDK install: https://ai.google.dev/gemini-api/docs/downloads

## 5. Update backend CORS if needed

This template defaults to permissive CORS for demo use. If you want to tighten it later, restrict `ALLOWED_ORIGINS` and the SAM `CorsConfiguration`.

## 6. Smoke test

```bash
curl <ApiUrl>/api/health
```

Then open the frontend URL, upload a small file, and send a chat question.
