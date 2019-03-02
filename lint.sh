cd node/
[ -d node_modules ] && rm -rf node_modules
yarn cache clean
yarn --frozen-lock
yarn lint
