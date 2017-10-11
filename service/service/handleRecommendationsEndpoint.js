"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const ramda_1 = require("ramda");
const paths_1 = require("./paths");
Promise = require('bluebird');
const getProductById = account => ({ Target: id }) => __awaiter(this, void 0, void 0, function* () {
    try {
        const config = {
            method: 'GET',
            url: paths_1.default.productById(account, { id }),
            headers: { accept: 'application/vnd.vtex.search-api.v0+json' },
        };
        const { data } = yield axios_1.default.request(config);
        return data;
    }
    catch (err) {
        if (err.response && err.response.status === 404) {
            return null;
        }
        throw err;
    }
});
exports.default = (body, ctx) => __awaiter(this, void 0, void 0, function* () {
    const id = body.root.id;
    const [prodViews, prodBuy] = yield Promise.all([
        axios_1.default.get(paths_1.default.recommendation(ctx.account, { id, type: 'ProdView' })).then(ramda_1.prop('data')),
        axios_1.default.get(paths_1.default.recommendation(ctx.account, { id, type: 'ProdBuy' })).then(ramda_1.prop('data')),
    ]);
    const [buy, view] = yield Promise.all([
        Promise.map(prodViews, getProductById(ctx.account)),
        Promise.map(prodBuy, getProductById(ctx.account)),
    ]);
    return { data: {
            buy: ramda_1.reject(ramda_1.isNil, buy),
            view: ramda_1.reject(ramda_1.isNil, view)
        } };
});
