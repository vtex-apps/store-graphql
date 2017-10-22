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
const defaultMerge = (bodyData, resData) => resData;
const removeDomain = (cookie) => cookie.replace(/domain=.+?(;|$)/, '');
exports.default = ({ method = 'GET', url, data = null, headers = {}, enableCookies = false, merge = defaultMerge }) => {
    return (body, ctx, req) => __awaiter(this, void 0, void 0, function* () {
        const builtUrl = (typeof url === 'function') ? url(ctx.account, body.data, body.root) : url;
        console.log(body.data);
        const builtData = (typeof data === 'function') ? data(body.data) : data;
        const builtHeaders = (typeof headers === 'function') ? yield headers(req, ctx) : headers;
        const config = { method, url: builtUrl, data: builtData, headers: builtHeaders };
        if (enableCookies && body.cookie) {
            config.headers.cookie = body.cookie;
        }
        const vtexResponse = yield axios_1.default.request(config);
        let cookie;
        if (enableCookies) {
            const setCookie = ramda_1.prop('set-cookie', vtexResponse.headers);
            if (setCookie) {
                cookie = ramda_1.map(removeDomain, setCookie);
            }
        }
        return { cookie, data: merge(body.data, vtexResponse.data) };
    });
};
