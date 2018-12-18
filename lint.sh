cd node/
[ -d node_modules ] && rm -rf node_modules
yarn cache clean
yarn
yarn lint
