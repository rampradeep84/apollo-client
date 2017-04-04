import { mockSubscriptionNetworkInterface, } from './mocks/mockNetworkInterface';
import { assert, } from 'chai';
import { cloneDeep } from 'lodash';
import { isSubscriptionResultAction } from '../src/actions';
import ApolloClient from '../src';
import gql from 'graphql-tag';
import { QueryManager, } from '../src/core/QueryManager';
import { createApolloStore, } from '../src/store';
describe('GraphQL Subscriptions', function () {
    var results = ['Dahivat Pandya', 'Vyacheslav Kim', 'Changping Chen', 'Amanda Liu'].map(function (name) { return ({ result: { user: { name: name } }, delay: 10 }); });
    var sub1;
    var options;
    var watchQueryOptions;
    var sub2;
    var commentsQuery;
    var commentsVariables;
    var commentsSub;
    var commentsResult;
    var commentsResultMore;
    var commentsWatchQueryOptions;
    beforeEach(function () {
        sub1 = {
            request: {
                query: (_a = ["\n          subscription UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], _a.raw = ["\n          subscription UserInfo($name: String) {\n            user(name: $name) {\n              name\n            }\n          }\n        "], gql(_a)),
                variables: {
                    name: 'Changping Chen',
                },
            },
            id: 0,
            results: results.slice(),
        };
        options = {
            query: (_b = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], _b.raw = ["\n        subscription UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], gql(_b)),
            variables: {
                name: 'Changping Chen',
            },
        };
        watchQueryOptions = {
            query: (_c = ["\n        query UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], _c.raw = ["\n        query UserInfo($name: String) {\n          user(name: $name) {\n            name\n          }\n        }\n      "], gql(_c)),
            variables: {
                name: 'Changping Chen',
            },
        };
        commentsQuery = (_d = ["\n      query Comment($repoName: String!) {\n        entry(repoFullName: $repoName) {\n          comments {\n            text\n          }\n        }\n      }\n    "], _d.raw = ["\n      query Comment($repoName: String!) {\n        entry(repoFullName: $repoName) {\n          comments {\n            text\n          }\n        }\n      }\n    "], gql(_d));
        commentsSub = (_e = ["\n      subscription getNewestComment($repoName: String!) {\n        getNewestComment(repoName: $repoName) {\n          text\n        }\n      }"], _e.raw = ["\n      subscription getNewestComment($repoName: String!) {\n        getNewestComment(repoName: $repoName) {\n          text\n        }\n      }"], gql(_e));
        commentsVariables = {
            repoName: 'org/repo',
        };
        commentsWatchQueryOptions = {
            query: commentsQuery,
            variables: commentsVariables,
        };
        commentsResult = {
            data: {
                entry: {
                    comments: [],
                },
            },
        };
        commentsResultMore = {
            result: {
                entry: {
                    comments: [],
                },
            },
        };
        for (var i = 1; i <= 10; i++) {
            commentsResult.data.entry.comments.push({ text: "comment " + i });
        }
        for (var i = 11; i < 12; i++) {
            commentsResultMore.result.entry.comments.push({ text: "comment " + i });
        }
        sub2 = {
            request: {
                query: commentsSub,
                variables: commentsVariables,
            },
            id: 0,
            results: [commentsResultMore],
        };
        var _a, _b, _c, _d, _e;
    });
    it('should start a subscription on network interface and unsubscribe', function (done) {
        var network = mockSubscriptionNetworkInterface([sub1]);
        var client = new ApolloClient({
            networkInterface: network,
            addTypename: false,
        });
        var sub = client.subscribe(options).subscribe({
            next: function (result) {
                assert.deepEqual(result, results[0].result);
                sub.unsubscribe();
                assert.equal(Object.keys(network.mockedSubscriptionsById).length, 0);
                done();
            },
        });
        var id = sub._networkSubscriptionId;
        network.fireResult(id);
        assert.equal(Object.keys(network.mockedSubscriptionsById).length, 1);
    });
    it('should multiplex subscriptions', function (done) {
        var network = mockSubscriptionNetworkInterface([sub1]);
        var queryManager = new QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: createApolloStore(),
            addTypename: false,
        });
        var obs = queryManager.startGraphQLSubscription(options);
        var counter = 0;
        var sub = obs.subscribe({
            next: function (result) {
                assert.deepEqual(result, results[0].result);
                counter++;
                if (counter === 2) {
                    done();
                }
            },
        });
        obs.subscribe({
            next: function (result) {
                assert.deepEqual(result, results[0].result);
                counter++;
                if (counter === 2) {
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        network.fireResult(id);
    });
    it('should receive multiple results for a subscription', function (done) {
        var network = mockSubscriptionNetworkInterface([sub1]);
        var numResults = 0;
        var queryManager = new QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: createApolloStore(),
            addTypename: false,
        });
        var sub = queryManager.startGraphQLSubscription(options).subscribe({
            next: function (result) {
                assert.deepEqual(result, results[numResults].result);
                numResults++;
                if (numResults === 4) {
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        for (var i = 0; i < 4; i++) {
            network.fireResult(id);
        }
    });
    it('should fire redux action and call result reducers', function (done) {
        var query = (_a = ["\n      query miniQuery {\n        number\n      }\n    "], _a.raw = ["\n      query miniQuery {\n        number\n      }\n    "], gql(_a));
        var res = {
            data: {
                number: 0,
            },
        };
        var req1 = {
            request: { query: query },
            result: res,
        };
        var network = mockSubscriptionNetworkInterface([sub1], req1);
        var numResults = 0;
        var counter = 0;
        var queryManager = new QueryManager({
            networkInterface: network,
            reduxRootSelector: function (state) { return state.apollo; },
            store: createApolloStore(),
            addTypename: false,
        });
        var observableQuery = queryManager.watchQuery({
            query: query,
            reducer: function (previousResult, action) {
                counter++;
                if (isSubscriptionResultAction(action)) {
                    var newResult = cloneDeep(previousResult);
                    newResult.number++;
                    return newResult;
                }
                return previousResult;
            },
        }).subscribe({
            next: function () { return null; },
        });
        var sub = queryManager.startGraphQLSubscription(options).subscribe({
            next: function (result) {
                assert.deepEqual(result, results[numResults].result);
                numResults++;
                if (numResults === 4) {
                    observableQuery.unsubscribe();
                    assert.equal(counter, 5);
                    assert.equal(queryManager.store.getState()['apollo']['data']['ROOT_QUERY']['number'], 4);
                    done();
                }
            },
        });
        var id = sub._networkSubscriptionId;
        for (var i = 0; i < 4; i++) {
            network.fireResult(id);
        }
        var _a;
    });
});
//# sourceMappingURL=graphqlSubscriptions.js.map