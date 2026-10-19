# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed
- Renamed `sapEmail` → `email` and `iNumber` → `employeeId` throughout codebase for generic use
- Email domain restriction is now configurable via `ALLOWED_EMAIL_DOMAIN` env var (empty = any domain allowed)
- Replaced SAP-specific branding with generic "Walkathon Tracker" / "Team Walking Challenge"
- Replaced hardcoded seed credentials with generic demo data
- `getUserFromSAPDirectory` renamed to `getUserFromOrgDirectory` in mock integrations
- Removed internal planning document (`walkathon-plan.html`)

### Added
- `LICENSE` (MIT)
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- GitHub issue templates and PR template
- CI workflow (Node.js 18/20/22)
