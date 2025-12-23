# Publishing to NPM

This project uses GitHub Actions to automatically publish to NPM when you create a release.

## Setup

1. **Create an NPM token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Automation"
   - Copy the token

2. **Add the token to GitHub Secrets:**
   - Go to your repository on GitHub
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

## How to Publish

### Option 1: Create a Release (Recommended)

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Choose a tag (e.g., `v1.0.0`, `v1.1.0`, `v2.0.0`)
   - If the tag doesn't exist, GitHub will create it
   - Tag format: `v1.0.0` (the `v` prefix is optional)
4. Fill in the release title and description
5. Click "Publish release"

The workflow will automatically:
- Extract the version from the tag (removes `v` prefix if present)
- Update `package.json` with the new version
- Build the project
- Publish to NPM

### Option 2: Push a Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will trigger and publish automatically.

## Version Format

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Examples: `1.0.0`, `1.1.0`, `2.0.0`
- The `v` prefix is optional: `v1.0.0` or `1.0.0` both work

## Notes

- You don't need to manually update the version in `package.json`
- The workflow automatically updates it based on the release tag
- The package will be published as `create-backforge-josebrusa`

