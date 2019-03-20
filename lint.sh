#!/bin/bash

cd node/
[ -d node_modules ] && rm -rf node_modules
yarn cache clean
yarn --frozen-lockfile
yarn lint
