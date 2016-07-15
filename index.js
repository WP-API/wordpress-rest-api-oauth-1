'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _oauth = require('oauth-1.0a');

var _oauth2 = _interopRequireDefault(_oauth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(config) {
		_classCallCheck(this, _class);

		if (!config.url) {
			throw new error('Please specify a url in the config object.');
		}
		this.config = _extends({
			credentials: {},
			brokerURL: 'https://apps.wp-api.org/'
		}, config);
	}

	_createClass(_class, [{
		key: 'getConsumerToken',
		value: function getConsumerToken() {
			var _this = this;

			if (!this.config.brokerCredentials) {
				throw new Error('Config does not include a brokerCredentials value.');
			}

			this.config.credentials.client = this.config.brokerCredentials.client;
			return this.post(this.config.brokerURL + 'broker/connect', {
				server_url: this.config.url
			}).then(function (data) {

				if (data.status && data.status === 'error') {
					throw { message: 'Broker error: ' + data.message, code: data.type };
				}
				_this.config.credentials.client = {
					public: data.client_token,
					secret: data.client_secret
				};

				return data;
			});
		}
	}, {
		key: 'getRequestToken',
		value: function getRequestToken() {
			var _this2 = this;

			if (!this.config.callbackURL) {
				throw new Error('Config does not include a callbackURL value.');
			}
			return this.post(this.config.url + 'oauth1/request', {
				callback_url: this.config.callbackURL
			}).then(function (data) {
				var redirectURL = _this2.config.url + 'oauth1/authorize?' + _queryString2.default.stringify({
					oauth_token: data.oauth_token,
					oauth_callback: _this2.config.callbackURL
				});

				_this2.config.credentials.token = {
					secret: data.oauth_token_secret
				};

				return { redirectURL: redirectURL, token: data };
			});
		}
	}, {
		key: 'getAccessToken',
		value: function getAccessToken(oauthVerifier) {
			var _this3 = this;

			return this.post(this.config.url + 'oauth1/access', {
				oauth_verifier: oauthVerifier
			}).then(function (data) {
				_this3.config.credentials.token = {
					public: data.oauth_token,
					secret: data.oauth_token_secret
				};

				return _this3.config.credentials.token;
			});
		}
	}, {
		key: 'authorize',
		value: function authorize(next) {

			var args = {};
			var savedCredentials = window.localStorage.getItem('requestTokenCredentials');
			if (window.location.href.indexOf('?')) {
				args = _queryString2.default.parse(window.location.href.split('?')[1]);
			}

			if (!this.config.credentials.client) {
				return this.getConsumerToken().then(this.authorize.bind(this));
			}

			if (this.config.credentials.token && this.config.credentials.token.public) {
				return Promise.resolve("Success");
			}

			if (savedCredentials) {
				this.config.credentials = JSON.parse(savedCredentials);
				window.localStorage.removeItem('requestTokenCredentials');
			}

			if (!this.config.credentials.token) {
				return this.getRequestToken().then(this.authorize.bind(this));
			} else if (!this.config.credentials.token.public && !savedCredentials) {
				window.localStorage.setItem('requestTokenCredentials', JSON.stringify(this.config.credentials));
				window.location = next.redirectURL;
				throw 'Redirect to authrization page...';
			} else if (!this.config.credentials.token.public && args.oauth_token) {
				this.config.credentials.token.public = args.oauth_token;
				return this.getAccessToken(args.oauth_verifier);
			}
		}
	}, {
		key: 'saveCredentials',
		value: function saveCredentials() {
			window.localStorage.setItem('tokenCredentials', JSON.stringify(this.config.credentials));
		}
	}, {
		key: 'removeCredentials',
		value: function removeCredentials() {
			delete this.config.credentials.token;
			window.localStorage.removeItem('tokenCredentials');
		}
	}, {
		key: 'restoreCredentials',
		value: function restoreCredentials() {
			var savedCredentials = window.localStorage.getItem('tokenCredentials');
			if (savedCredentials) {
				this.config.credentials = JSON.parse(savedCredentials);
			}
			return this;
		}
	}, {
		key: 'get',
		value: function get(url, data) {
			url = url += !data ? '' : '?' + _queryString2.default.stringify(data);
			return this.request('GET', url);
		}
	}, {
		key: 'post',
		value: function post(url, data) {
			return this.request('POST', url, data);
		}
	}, {
		key: 'del',
		value: function del(url, data, callback) {
			return this.request('DELETE', url, data);
		}
	}, {
		key: 'request',
		value: function request(method, url) {
			var data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];


			if (this.config.credentials.client) {
				this.oauth = new _oauth2.default({
					consumer: this.config.credentials.client,
					signature_method: 'HMAC-SHA1'
				});
			}

			if (url.indexOf('http') !== 0) {
				url = this.config.url + 'wp-json' + url;
			}

			if (this.oauth) {
				var oauthData = this.oauth.authorize({
					method: method,
					url: url,
					data: data
				}, this.config.credentials.token ? this.config.credentials.token : null);
			}

			var headers = {
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			};

			if (this.oauth) {
				headers = _extends({}, headers, this.oauth.toHeader(oauthData));
			}

			return fetch(url, {
				method: method,
				headers: headers,
				mode: 'cors',
				body: ['GET', 'HEAD'].indexOf(method) > -1 ? null : _queryString2.default.stringify(data)
			}).then(function (response) {
				if (response.headers.get('Content-Type') && response.headers.get('Content-Type').indexOf('x-www-form-urlencoded') > -1) {
					return response.text().then(function (text) {
						return _queryString2.default.parse(text);
					});
				}
				return response.text().then(function (text) {

					try {
						var json = JSON.parse(text);
					} catch (e) {
						throw { message: text, code: response.status };
					}

					if (response.status >= 300) {
						throw json;
					} else {
						return json;
					}
				});
			});
		}
	}]);

	return _class;
}();

exports.default = _class;