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
const ramda_1 = require("ramda");
const paths_1 = require("./paths");
const axios_1 = require("axios");
const createClient = (account, orderFormId, authToken) => {
    const headers = {
        Authorization: `bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    return {
        addToken: (paymentToken) => {
            const payload = { paymentToken, expectedOrderFormSections: ['items', 'paymentData'] };
            const url = paths_1.default.orderFormPaymentToken(account, { orderFormId });
            return axios_1.default.put(url, payload, { headers });
        },
        removeToken: (tokenId) => {
            const url = paths_1.default.orderFormPaymentTokenId(account, { orderFormId, tokenId });
            return axios_1.default.delete(url, { headers, data: { expectedOrderFormSections: ['items'] } });
        },
    };
};
exports.default = (body, ctx, req) => __awaiter(this, void 0, void 0, function* () {
    const { data: { orderFormId, paymentToken } } = body;
    const checkout = createClient(ctx.account, orderFormId, ctx.authToken);
    const response = yield checkout.addToken(paymentToken);
    const { data: { paymentData: { availableTokens } } } = response;
    const tokensToRemove = ramda_1.reject(ramda_1.propEq('tokenId', paymentToken.tokenId), availableTokens);
    if (tokensToRemove.length === 0) {
        return { data: ramda_1.merge(body.data, response.data) };
    }
    const lastDeleteResponse = yield Promise.mapSeries(tokensToRemove, ({ tokenId }) => checkout.removeToken(tokenId)).then(ramda_1.last);
    return { data: ramda_1.merge(body.data, lastDeleteResponse['data']) };
});
