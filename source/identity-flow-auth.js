import OptionsSync from 'webext-options-sync';

const CLIENT_ID = 'c209d287b799e3899f7a';
const CLIENT_SECRET = '2eab029032e28d0ca69b2cbf4332c813672f0003';
const CALLBACK_URL = browser.identity.getRedirectURL();
const SCOPES = ['notifications'].join(',');

const syncStore = new OptionsSync();

async function getBase() {
	const {rootUrl} = await syncStore.getAll();
	const url = new URL(rootUrl);

	if (url.hostname === 'api.github.com') {
		return 'https://github.com';
	} else {
		return rootUrl;
	}
}

async function getAuthURL() {
	const base = await getBase();

	const url = new URL('/login/oauth/authorize', base);
	url.searchParams.append('client_id', CLIENT_ID);
	url.searchParams.append('redirect_uri', CALLBACK_URL);
	url.searchParams.append('scope', SCOPES);

	return url.href;
}

async function getTokenRequestURL(code) {
	const base = await getBase();

	const url = new URL('/login/oauth/access_token', base);
	url.searchParams.append('client_id', CLIENT_ID);
	url.searchParams.append('client_secret', CLIENT_SECRET);
	url.searchParams.append('code', code);

	return url.href;
}

async function getTokenFromCode(code) {
	const tokenRequestURL = await getTokenRequestURL(code);
	const response = await fetch(tokenRequestURL, {
		method: 'post',
		headers: {
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		return false;
	}

	const data = await response.json();

	if (data.error) {
		return false;
	}

	return data['access_token'];
}

async function fetchToken() {
	const authURL = await getAuthURL();

	const redirectURL = await browser.identity.launchWebAuthFlow({
		url: authURL,
		interactive: true
	});

	console.log('redirect url', redirectURL);
	const url = new URL(redirectURL);

	return getTokenFromCode(url.searchParams.get('code'));
}

export {
	fetchToken
};
