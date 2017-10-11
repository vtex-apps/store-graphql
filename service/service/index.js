"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
const handleEndpoint_1 = require("./handleEndpoint");
const handleProfileEndpoint_1 = require("./handleProfileEndpoint");
const handleRecommendationsEndpoint_1 = require("./handleRecommendationsEndpoint");
const paths_1 = require("./paths");
const vtex_graphql_builder_1 = require("vtex-graphql-builder");
const handlePaymentTokenEndpoint_1 = require("./handlePaymentTokenEndpoint");
const axios_1 = require("axios");
axios_1.default.interceptors.response.use(response => { console.log(response); return response; }, function (error) {
    if (error.response) {
        console.log(error);
        const responseData = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
        const message = `External HTTP request failed. method=${error.response.config.method} status=${error.response.status} url=${error.config.url} data=${responseData}`;
        throw new vtex_graphql_builder_1.ResolverError(message, error.response.status);
    }
    throw error;
});
Promise = require('bluebird');
const facadeHeaders = { accept: 'application/vnd.vtex.search-api.v0+json' };
exports.default = vtex_graphql_builder_1.buildResolvers({
    Query: {
        product: handleEndpoint_1.default({
            url: paths_1.default.product,
            headers: facadeHeaders,
        }),
        products: handleEndpoint_1.default({
            url: paths_1.default.products,
            headers: facadeHeaders,
        }),
        category: handleEndpoint_1.default({
            url: paths_1.default.category,
            headers: facadeHeaders,
        }),
        categories: handleEndpoint_1.default({
            url: paths_1.default.categories,
            headers: facadeHeaders,
        }),
        brand: handleEndpoint_1.default({
            url: paths_1.default.brand,
            headers: facadeHeaders,
        }),
        shipping: handleEndpoint_1.default({ url: paths_1.default.shipping }),
        orderForm: handleEndpoint_1.default({
            method: 'POST',
            enableCookies: true,
            url: paths_1.default.orderForm,
            data: { expectedOrderFormSections: ['items'] },
        }),
        orders: handleEndpoint_1.default({
            enableCookies: true,
            url: paths_1.default.orders,
        }),
        profile: handleProfileEndpoint_1.handleProfileEndpoint,
        autocomplete: handleEndpoint_1.default({ url: paths_1.default.autocomplete }),
        search: handleEndpoint_1.default({
            url: paths_1.default.search,
            headers: facadeHeaders
        })
    },
    Mutation: {
        addItem: handleEndpoint_1.default({
            method: 'POST',
            enableCookies: true,
            url: paths_1.default.addItem,
            data: ({ items }) => ({ orderItems: items, expectedOrderFormSections: ['items'] }),
        }),
        cancelOrder: handleEndpoint_1.default({
            method: 'POST',
            enableCookies: true,
            url: paths_1.default.cancelOrder,
            data: ({ reason }) => ({ reason }),
            merge: () => ({ success: true }),
        }),
        updateItems: handleEndpoint_1.default({
            method: 'POST',
            enableCookies: true,
            url: paths_1.default.updateItems,
            data: ({ items }) => ({ orderItems: items, expectedOrderFormSections: ['items'] }),
        }),
        updateProfile: handleEndpoint_1.default({
            method: 'PATCH',
            url: (account, { id }) => paths_1.default.profile(account).profile(id),
            data: ({ fields }) => fields,
            headers: handleProfileEndpoint_1.profileCustomHeaders(),
            merge: ({ id, fields }) => ramda_1.merge({ id }, fields),
        }),
        updateAddress: handleEndpoint_1.default({
            method: 'PATCH',
            url: (account, { id }) => paths_1.default.profile(account).address(id),
            data: ({ fields }) => fields,
            headers: handleProfileEndpoint_1.profileCustomHeaders(),
            merge: ({ id, fields }) => ramda_1.merge({ id }, fields),
        }),
        createAddress: handleEndpoint_1.default({
            method: 'PATCH',
            url: account => paths_1.default.profile(account).address(''),
            data: ({ fields }) => fields,
            headers: handleProfileEndpoint_1.profileCustomHeaders(),
            merge: ({ id, fields }) => ramda_1.merge({ id }, fields),
        }),
        deleteAddress: handleEndpoint_1.default({
            method: 'DELETE',
            url: (account, { id }) => paths_1.default.profile(account).address(id),
            headers: handleProfileEndpoint_1.profileCustomHeaders(),
        }),
        setPlaceholder: handleEndpoint_1.default({
            method: 'PUT',
            enableCookies: true,
            url: paths_1.default.placeholders,
            data: ({ fields }) => ramda_1.merge(ramda_1.merge({}, fields), { settings: JSON.parse(fields.settings) }),
        }),
        updateOrderFormProfile: handleEndpoint_1.default({
            method: 'POST',
            url: paths_1.default.orderFormProfile,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: ({ fields }) => ramda_1.merge({ expectedOrderFormSections: ['items'] }, fields),
        }),
        updateOrderFormShipping: handleEndpoint_1.default({
            method: 'POST',
            url: paths_1.default.orderFormShipping,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: (data) => ramda_1.merge({ expectedOrderFormSections: ['items'] }, data),
        }),
        updateOrderFormPayment: handleEndpoint_1.default({
            method: 'POST',
            url: paths_1.default.orderFormPayment,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: ({ payments }) => ramda_1.merge({ expectedOrderFormSections: ['items'] }, { payments }),
        }),
        addOrderFormPaymentToken: handlePaymentTokenEndpoint_1.default,
        updateOrderFormIgnoreProfile: handleEndpoint_1.default({
            method: 'PATCH',
            url: paths_1.default.orderFormIgnoreProfile,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: ({ ignoreProfileData }) => ({ expectedOrderFormSections: ['items'], ignoreProfileData }),
        }),
        createPaymentSession: handleEndpoint_1.default({
            method: 'POST',
            url: paths_1.default.gatewayPaymentSession,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
        }),
        createPaymentTokens: handleEndpoint_1.default({
            method: 'POST',
            url: paths_1.default.gatewayTokenizePayment,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: ({ payments }) => payments,
        }),
        setOrderFormCustomData: handleEndpoint_1.default({
            method: 'PUT',
            url: paths_1.default.orderFormCustomData,
            headers: handleProfileEndpoint_1.profileCustomHeaders('application/json'),
            data: ({ value }) => ({ expectedOrderFormSections: ['customData'], value }),
        }),
    },
    Product: {
        recommendations: handleRecommendationsEndpoint_1.default,
    },
});
