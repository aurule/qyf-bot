# Release Guide

Steps to do:

1. run `sh scripts/start-release.sh <version>`
    * this creates the branch `release/<version>`
    * then runs `npm --no-git-tag-version version <version>` to update the version in package.json and package-lock.json
    * then runs `npm run changelog:build` to generate the new version's changelog
2. commit!
3. merge the release branch into `main`
4. tag the merge commit with the new version
5. merge the release branch into `develop`
6. delete the release branch
7. push main to deploy the release
