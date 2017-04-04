import * as chai from 'chai';
var assert = chai.assert;
import mockNetworkInterface from './mocks/mockNetworkInterface';
import ApolloClient from '../src';
import { NetworkStatus } from '../src/queries/networkStatus';
import { assign, cloneDeep } from 'lodash';
import gql from 'graphql-tag';
describe('updateQuery on a simple query', function () {
    var query = (_a = ["\n    query thing {\n      entry {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], _a.raw = ["\n    query thing {\n      entry {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], gql(_a));
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                value: 1,
            },
        },
    };
    it('triggers new result from updateQuery', function () {
        var latestResult = null;
        var networkInterface = mockNetworkInterface({
            request: { query: query },
            result: result,
        });
        var client = new ApolloClient({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var obsHandle = client.watchQuery({
            query: query,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
            },
        });
        return new Promise(function (resolve) { return setTimeout(resolve, 5); })
            .then(function () { return obsHandle; })
            .then(function (watchedQuery) {
            assert.equal(latestResult.data.entry.value, 1);
            watchedQuery.updateQuery(function (prevResult) {
                var res = cloneDeep(prevResult);
                res.entry.value = 2;
                return res;
            });
            assert.equal(latestResult.data.entry.value, 2);
        })
            .then(function () { return sub.unsubscribe(); });
    });
    var _a;
});
describe('updateQuery on a query with required and optional variables', function () {
    var query = (_a = ["\n    query thing($requiredVar: String!, $optionalVar: String) {\n      entry(requiredVar: $requiredVar, optionalVar: $optionalVar) {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], _a.raw = ["\n    query thing($requiredVar: String!, $optionalVar: String) {\n      entry(requiredVar: $requiredVar, optionalVar: $optionalVar) {\n        value\n        __typename\n      }\n      __typename\n    }\n  "], gql(_a));
    var variables = {
        requiredVar: 'x',
    };
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                value: 1,
            },
        },
    };
    it('triggers new result from updateQuery', function () {
        var latestResult = null;
        var networkInterface = mockNetworkInterface({
            request: {
                query: query,
                variables: variables,
            },
            result: result,
        });
        var client = new ApolloClient({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var obsHandle = client.watchQuery({
            query: query,
            variables: variables,
        });
        var sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
            },
        });
        return new Promise(function (resolve) { return setTimeout(resolve, 5); })
            .then(function () { return obsHandle; })
            .then(function (watchedQuery) {
            assert.equal(latestResult.data.entry.value, 1);
            watchedQuery.updateQuery(function (prevResult) {
                var res = cloneDeep(prevResult);
                res.entry.value = 2;
                return res;
            });
            assert.equal(latestResult.data.entry.value, 2);
        })
            .then(function () { return sub.unsubscribe(); });
    });
    var _a;
});
describe('fetchMore on an observable query', function () {
    var query = (_a = ["\n    query Comment($repoName: String!, $start: Int!, $limit: Int!) {\n      entry(repoFullName: $repoName) {\n        comments(start: $start, limit: $limit) {\n          text\n          __typename\n        }\n        __typename\n      }\n    }\n  "], _a.raw = ["\n    query Comment($repoName: String!, $start: Int!, $limit: Int!) {\n      entry(repoFullName: $repoName) {\n        comments(start: $start, limit: $limit) {\n          text\n          __typename\n        }\n        __typename\n      }\n    }\n  "], gql(_a));
    var query2 = (_b = ["\n    query NewComments($start: Int!, $limit: Int!) {\n      comments(start: $start, limit: $limit) {\n        text\n        __typename\n      }\n      __typename\n    }\n  "], _b.raw = ["\n    query NewComments($start: Int!, $limit: Int!) {\n      comments(start: $start, limit: $limit) {\n        text\n        __typename\n      }\n      __typename\n    }\n  "], gql(_b));
    var variables = {
        repoName: 'org/repo',
        start: 0,
        limit: 10,
    };
    var variablesMore = assign({}, variables, { start: 10, limit: 10 });
    var variables2 = {
        start: 10,
        limit: 20,
    };
    var result = {
        data: {
            __typename: 'Query',
            entry: {
                __typename: 'Entry',
                comments: [],
            },
        },
    };
    var resultMore = cloneDeep(result);
    var result2 = {
        data: {
            __typename: 'Query',
            comments: [],
        },
    };
    for (var i = 1; i <= 10; i++) {
        result.data.entry.comments.push({ text: "comment " + i, __typename: 'Comment' });
    }
    for (var i = 11; i <= 20; i++) {
        resultMore.data.entry.comments.push({ text: "comment " + i, __typename: 'Comment' });
        result2.data.comments.push({ text: "new comment " + i, __typename: 'Comment' });
    }
    var latestResult = null;
    var client;
    var networkInterface;
    var sub;
    function setup() {
        var mockedResponses = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            mockedResponses[_i] = arguments[_i];
        }
        networkInterface = mockNetworkInterface.apply(void 0, [{
                request: {
                    query: query,
                    variables: variables,
                },
                result: result,
            }].concat(mockedResponses));
        client = new ApolloClient({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var obsHandle = client.watchQuery({
            query: query,
            variables: variables,
        });
        sub = obsHandle.subscribe({
            next: function (queryResult) {
                latestResult = queryResult;
            },
        });
        return Promise.resolve(obsHandle);
    }
    ;
    function unsetup() {
        sub.unsubscribe();
        sub = null;
    }
    it('basic fetchMore results merging', function () {
        latestResult = null;
        return setup({
            request: {
                query: query,
                variables: variablesMore,
            },
            result: resultMore,
        }).then(function (watchedQuery) {
            return watchedQuery.fetchMore({
                variables: { start: 10 },
                updateQuery: function (prev, options) {
                    var state = cloneDeep(prev);
                    state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.entry.comments);
                    return state;
                },
            });
        }).then(function (data) {
            assert.lengthOf(data.data.entry.comments, 10);
            assert.isFalse(data.loading);
            var comments = latestResult.data.entry.comments;
            assert.lengthOf(comments, 20);
            for (var i = 1; i <= 20; i++) {
                assert.equal(comments[i - 1].text, "comment " + i);
            }
            unsetup();
        });
    });
    it('fetching more with a different query', function () {
        latestResult = null;
        return setup({
            request: {
                query: query2,
                variables: variables2,
            },
            result: result2,
        }).then(function (watchedQuery) {
            return watchedQuery.fetchMore({
                query: query2,
                variables: variables2,
                updateQuery: function (prev, options) {
                    var state = cloneDeep(prev);
                    state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.comments);
                    return state;
                },
            });
        }).then(function () {
            var comments = latestResult.data.entry.comments;
            assert.lengthOf(comments, 20);
            for (var i = 1; i <= 10; i++) {
                assert.equal(comments[i - 1].text, "comment " + i);
            }
            for (var i = 11; i <= 20; i++) {
                assert.equal(comments[i - 1].text, "new comment " + i);
            }
            unsetup();
        });
    });
    it('will set the network status to `fetchMore`', function (done) {
        networkInterface = mockNetworkInterface({ request: { query: query, variables: variables }, result: result, delay: 5 }, { request: { query: query, variables: variablesMore }, result: resultMore, delay: 5 });
        client = new ApolloClient({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var observable = client.watchQuery({
            query: query,
            variables: variables,
            notifyOnNetworkStatusChange: true,
        });
        var count = 0;
        observable.subscribe({
            next: function (_a) {
                var data = _a.data, networkStatus = _a.networkStatus;
                switch (count++) {
                    case 0:
                        assert.equal(networkStatus, NetworkStatus.ready);
                        assert.equal(data.entry.comments.length, 10);
                        observable.fetchMore({
                            variables: { start: 10 },
                            updateQuery: function (prev, options) {
                                var state = cloneDeep(prev);
                                state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.entry.comments);
                                return state;
                            },
                        });
                        break;
                    case 1:
                        assert.equal(networkStatus, NetworkStatus.fetchMore);
                        assert.equal(data.entry.comments.length, 10);
                        break;
                    case 2:
                        assert.equal(networkStatus, NetworkStatus.ready);
                        assert.equal(data.entry.comments.length, 10);
                        break;
                    case 3:
                        assert.equal(networkStatus, NetworkStatus.ready);
                        assert.equal(data.entry.comments.length, 20);
                        done();
                        break;
                    default:
                        done(new Error('`next` called too many times'));
                }
            },
            error: function (error) { return done(error); },
            complete: function () { return done(new Error('Should not have completed')); },
        });
    });
    it('will get an error from `fetchMore` if thrown', function (done) {
        networkInterface = mockNetworkInterface({ request: { query: query, variables: variables }, result: result, delay: 5 }, { request: { query: query, variables: variablesMore }, error: new Error('Uh, oh!'), delay: 5 });
        client = new ApolloClient({
            networkInterface: networkInterface,
            addTypename: true,
        });
        var observable = client.watchQuery({
            query: query,
            variables: variables,
            notifyOnNetworkStatusChange: true,
        });
        var count = 0;
        observable.subscribe({
            next: function (_a) {
                var data = _a.data, networkStatus = _a.networkStatus;
                switch (count++) {
                    case 0:
                        assert.equal(networkStatus, NetworkStatus.ready);
                        assert.equal(data.entry.comments.length, 10);
                        observable.fetchMore({
                            variables: { start: 10 },
                            updateQuery: function (prev, options) {
                                var state = cloneDeep(prev);
                                state.entry.comments = state.entry.comments.concat(options.fetchMoreResult.entry.comments);
                                return state;
                            },
                        });
                        break;
                    case 1:
                        assert.equal(networkStatus, NetworkStatus.fetchMore);
                        assert.equal(data.entry.comments.length, 10);
                        break;
                    default:
                        done(new Error('`next` called when it wasn’t supposed to be.'));
                }
            },
            error: function (error) {
                try {
                    switch (count++) {
                        case 2:
                            assert.equal(error.message, 'Network error: Uh, oh!');
                            done();
                            break;
                        default:
                            done(new Error('`error` called when it wasn’t supposed to be.'));
                    }
                }
                catch (error) {
                    done(error);
                }
            },
            complete: function () { return done(new Error('`complete` called when it wasn’t supposed to be.')); },
        });
    });
    var _a, _b;
});
//# sourceMappingURL=fetchMore.js.map