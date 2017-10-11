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
const paths_1 = require("./paths");
const axios_1 = require("axios");
const cookie_1 = require("cookie");
const ramda_1 = require("ramda");
const vtex_graphql_builder_1 = require("vtex-graphql-builder");
exports.profileCustomHeaders = (accept = 'application/vnd.vtex.ds.v10+json') => (req, { authToken }) => __awaiter(this, void 0, void 0, function* () {
    return {
        Authorization: `bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: accept,
    };
});
const configRequest = (req, ctx, url) => __awaiter(this, void 0, void 0, function* () {
    return ({
        url,
        method: 'GET',
        headers: yield exports.profileCustomHeaders()(req, ctx),
    });
});
const profile = (req, ctx) => (data) => __awaiter(this, void 0, void 0, function* () {
    if (data === null) {
        return data;
    }
    const { user } = data;
    const profileRequest = yield configRequest(req, ctx, paths_1.default.profile(ctx.account).filterUser(user));
    const profileData = yield axios_1.default.request(profileRequest).then(ramda_1.pipe(ramda_1.prop('data'), ramda_1.head));
    const addressRequest = profileData && (yield configRequest(req, ctx, paths_1.default.profile(ctx.account).filterAddress(profileData.id)));
    const address = addressRequest && (yield axios_1.default.request(addressRequest).then(ramda_1.prop('data')));
    return ramda_1.merge({ address }, profileData);
});
exports.handleProfileEndpoint = (body, ctx, req) => __awaiter(this, void 0, void 0, function* () {
    const { account, workspace } = ctx;
    const parsedCookies = cookie_1.parse(body.cookie || '');
    const startsWithVtexId = (val, key) => key.startsWith('VtexIdclientAutCookie');
    const token = ramda_1.head(ramda_1.values(ramda_1.pickBy(startsWithVtexId, parsedCookies)));
    if (!token) {
        throw new vtex_graphql_builder_1.ResolverError('User is not authenticated.', 401);
    }
    const config = {
        url: paths_1.default.identity(account, { token }),
        method: 'GET',
    };
    return { data: yield axios_1.default.request(config).then(ramda_1.prop('data')).then(profile(req, ctx)) };
});
