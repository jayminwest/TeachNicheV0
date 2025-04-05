# Development Workflow

This document outlines the recommended development workflow for the TeachNiche project, including branching strategy, code review process, and release procedures.

## Environment Setup

Before starting development, ensure your local environment is properly set up:

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Set up environment variables (see [Environment Configuration](/documentation/workflow/environment-setup.md))
4. Start the development server with `pnpm dev`

## Branching Strategy

We follow a simplified Git Flow branching strategy:

### Main Branches

- **main**: Production-ready code that has been deployed
- **development**: Integration branch for features and bug fixes

### Feature Branches

For new features, bug fixes, or improvements:

1. Create a branch from `development` following the naming convention:
   - Features: `feature/short-description`
   - Bug fixes: `fix/issue-description`
   - Documentation: `docs/what-is-being-documented`
   - Refactoring: `refactor/what-is-being-refactored`

Example:
```bash
git checkout development
git pull
git checkout -b feature/instructor-analytics
```

## Commit Message Guidelines

We follow the Conventional Commits specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(dashboard): add instructor earnings chart
fix(auth): resolve login redirect issue
docs: update API documentation
```

## Pull Request Process

1. Complete your changes in your feature branch
2. Push your branch to GitHub
3. Create a Pull Request to merge into `development`
4. Fill out the PR template with:
   - Description of changes
   - Issue links (if applicable)
   - Testing instructions
   - Screenshots (if UI changes)

### Code Review

All PRs require at least one approving review before merging:

- Code style adherence
- Functionality testing
- Performance considerations
- Documentation updates

## Testing Requirements

Before submitting a PR:

1. Ensure existing tests pass (`pnpm test`)
2. Add tests for new functionality
3. Verify the application works locally in development mode
4. Check for TypeScript errors (`pnpm typecheck`)
5. Run linting (`pnpm lint`)

## Deployment Process

### Staging Deployment

1. Merges to `development` trigger automatic deployment to the staging environment
2. QA testing is performed on the staging environment
3. Any issues found are fixed in additional PRs to `development`

### Production Deployment

1. When `development` is stable, create a PR from `development` to `main`
2. Perform final review and testing
3. Merge to `main` triggers automatic deployment to production
4. Tag the release with a version number following semantic versioning

Example:
```bash
git checkout main
git pull
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

## Version Control

We follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Incompatible API changes
- MINOR: Add functionality in a backward-compatible manner
- PATCH: Backward-compatible bug fixes

## Database Changes

For changes that require database modifications:

1. Create a migration file in `supabase/migrations` with a timestamp prefix
2. Document the changes in the PR description
3. Update the database schema documentation

Example migration file name: `20250405000000_add_analytics_table.sql`

## Release Notes

For each version release:

1. Document major changes, bug fixes, and new features
2. Note any breaking changes or migration steps
3. Credit contributors
4. Update the CHANGELOG.md file

## Continuous Integration

Our CI pipeline runs automatically on PR creation and includes:

1. Dependency installation
2. Type checking
3. Linting
4. Unit tests
5. Build verification

All CI checks must pass before a PR can be merged.

## Issue Tracking

We use GitHub Issues for tracking work:

- Bug reports should include steps to reproduce, expected vs. actual behavior
- Feature requests should include user stories and acceptance criteria
- Use labels to categorize issues (bug, enhancement, documentation, etc.)

## Development Best Practices

1. **Keep PRs focused**: Each PR should address a single concern
2. **Write meaningful tests**: Ensure code changes are covered by tests
3. **Document as you go**: Update documentation alongside code changes
4. **Performance matters**: Consider performance implications of your changes
5. **Accessibility**: Ensure UI changes meet accessibility standards
6. **Mobile responsiveness**: Test your changes on multiple screen sizes
