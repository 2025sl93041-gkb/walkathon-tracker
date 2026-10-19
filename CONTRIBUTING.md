# Contributing to Walkathon Tracker

Thank you for your interest in contributing!

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Local Setup

```bash
git clone https://github.com/2025sl93041-gkb/walkathon-tracker.git
cd walkathon-tracker

# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # runs on http://localhost:3000
```

The frontend proxies `/api` requests to `localhost:5000` via Vite config.

## Contributor License Agreement (CLA)

Before your first PR can be merged, you must sign the [CLA](CLA.md). The CLA Assistant bot will post a comment on your PR with instructions. Sign by commenting:

> I have read the CLA Document and I hereby sign the CLA

You only need to sign once. Subsequent PRs from your account are automatically approved.

## How to Contribute

1. **Fork** the repo and create a branch from `main`:
   ```
   git checkout -b fix/your-description
   ```
2. Make your changes. Keep each PR focused on one thing.
3. Ensure the backend starts without errors (`npm run dev`).
4. Open a **Pull Request** against `main`. Fill in the PR template.

## Reporting Bugs

Open a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue. Include steps to reproduce, expected vs actual behavior, and your Node version.

## Requesting Features

Open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) issue. Describe the problem you are solving.

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add email domain restriction config
fix: correct step count validation
docs: update API endpoint table
```

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
