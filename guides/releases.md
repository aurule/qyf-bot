# Release Guide

Steps to do:

1. make a release branch
2. run `npm --no-git-tag-version version <arg>` to update the version in package.json and package-lock.json
    * arg can be one of patch, minor, major, prepatch, preminor, premajor, prerelease
3. run `npm run build-changelog` to generate the new changelog entry
4. commit!
5. merge the release branch into main
    * copy the changelog into the commit message
6. tag the merge commit with the new version
7. merge the release branch into develop
8. delete the release branch
9. push main to deploy the release
