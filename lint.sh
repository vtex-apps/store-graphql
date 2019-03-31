#!/bin/bash

cd node/
[ -d node_modules ] && rm -rf node_modules
yarn --frozen-lockfile
yarn lint
