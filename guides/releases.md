# Release Guide

Steps to do:

1. make a release branch
2. update the version in package.json
3. run `npm install` to propagate the version to package-lock.json
4. run `npm test` to make sure nothing broke
5. run `npm run build-changelog` to generate the new changelog entry
6. commit!
7. merge the release branch into main
    * copy the changelog into the commit message
8. tag the merge commit with the new version
9. merge the release branch into develop
9. delete the release branch
10. push main to deploy the release
