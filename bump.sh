#!/bin/bash

# Exit if any command fails
set -e

# Step 1: Bump patch version in package.json using npm
newversion=$(npm version patch --no-git-tag-version)

# Step 2: Stage changes
git add -u

# Step 3: Commit with a generic message
git commit -m "update"

# Step 4: Push changes to skairipaapps remote master branch
git push skairipaapps master

# Step 5: Tag the commit with the new version
git tag "$newversion"

# Step 6: Push tags to skairipaapps
git push skairipaapps --tags

echo "✅ Version bumped to $newversion and pushed successfully."

npm run build:package && npm run publish:prepare && npm run publish:draft && npm publish
