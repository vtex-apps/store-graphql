#!/bin/bash

cd node/
[ -d node_modules ] && rm -rf node_modules
yarn cache clean
yarn --frozen-lockfile
yarn run tslint --fix --project .
yarn run prettier --write "**/*.ts"
yarn check
