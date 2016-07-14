# WordPress REST API OAuth 1 Client

JavaScript OAuth 1 Client for the WordPress REST API v2.

## Install

```
npm install --save wordpress-rest-api-oauth-1
```

## Configuration

### Without Authentication

```JS
import api from 'wordpress-rest-api-oauth-1'

const demoApi = new api({
	url: 'https://demo.wp-api.org/'
})
```
### Using OAuth 1 Directly

To communication and authenticate using OAuth 1 with your WordPress site directly:

```JS
import api from 'wordpress-rest-api-oauth-1'

const demoApi = new api({
	url: 'https://demo.wp-api.org/',
	credentials: {
		client: {
			public: 'xxxxxx',
			secret: 'xxxxxxxxxxxxxxxxxxx'
		}
	}
})
```

### Using the WordPress Authentication Broker

To establish a connection to a WordPress site that accepts the WordPress REST API Broker:

```JS
import api from 'wordpress-rest-api-oauth-1'

const demoApi = new api({
	url: 'https://demo.wp-api.org/',
	brokerCredentials: {
		client: {
			public: 'xxxxxx',
			secret: 'xxxxxxxxxxxxxxxxxxx'
		}
	}
})

// Get OAuth client tokens for the specified site. This is not needed if using `authorize()`.
demoApi.getConsumerToken().then( token => {
	console.log( token )
})
```

### Usage

#### Authorize / OAuth Flow

There is two ways to get authentication tokens, one "high level" function, or you can implement your own flow using the underlaying function.

##### The Quick Way

```JS
demoApi.authorize().then( function() {
	console.log( 'All API requests are now authenticated.' )
})

// Note: the above will cause a redirect / resume of the app in the event that the user needs to authorize.
```

##### Control your own flow

```JS
// Get client tokens from the broker (optional)
demoApi.getConsumerToken().then( ... )

// Get a request token
demo.getRequestToken() )
	.then( token => {
		// handle the user authorize redirect with token.redirectURL
	})

// Exchange for an access token
demo.getAccessToken( oAuthVerifier )
	.then( token => {
		// save the token to localStorage etc.
	})
```

#### Make API Requests

You can make API requests directly with this library for both authenticated requests and anonymous.


```JS
demoApi.get( '/wp/v2/posts', { per_page: 5 } ).then( posts => {
	console.log( posts )
})

demoApi.post( '/wp/v2/posts', { title: 'Test new post' } } ).then( post => {
	console.log( post )
})

demoApi.del( '/wp/v2/posts/1' ).then( post => {
	console.log( 'Deleted post.' )
})
```

### Loading and Saving Credentials

With OAuth in the browser, you don't typically want to run through the authorization flow on every page load, so you can export and import the credentials if you wish:

```JS
// init API with credentials:
new api({
	url: siteURL,
	credentials: JSON.parse( localStorage.getItem( 'authCredentials' ) )
})

// save the credentials
localStorage.setItem( 'authCredentials', JSON.stringify( demoApi.config.credentials ) )
```

You can also have the library store and retrieve the credentials:

```JS
demoApi.restoreCredentials().get( '/wp/v2/users/me' )

demoApi.saveCredentials() // Save the credentials to localStorage
```

To implement restoring of credentials and auth in one go:

```JS
demoApi.restoreCredentials().authorize().then( function() {
	demoApi.saveCredentials()
})
```
