import OptionsSync from 'webext-options-sync';
import {queryPermission, requestPermission} from './lib/permissions-service';
import {fetchToken} from './identity-flow-auth';

const syncStore = new OptionsSync();
syncStore.syncForm('#options-form');

async function update({target: input}) {
	if (input.name === 'showDesktopNotif' && input.checked) {
		try {
			const alreadyGranted = await queryPermission('notifications');

			if (!alreadyGranted) {
				const granted = await requestPermission('notifications');
				input.checked = granted;
			}
		} catch (err) {
			input.checked = false;

			// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1382953
			document.getElementById('notifications-permission-error').style.display = 'block';
		}
	}

	browser.runtime.sendMessage('update');
};

// TODO: Find better way of doing this
for (const input of document.querySelectorAll('#options-form [name]')) {
	input.addEventListener('change', update);
}

const tokenInputField = document.querySelector('input[name="token"]');
const authFlowButton = document.querySelector('.js-auth-flow');
authFlowButton.addEventListener('click', async () => {
	const {rootUrl} = await syncStore.getAll();
	const url = new URL(rootUrl);
	const origin = url.hostname === 'api.github.com' ? 'github.com' : url.origin;

	try {
		const alreadyGranted = await queryPermission(origin);

		if (!alreadyGranted) {
			const granted = await requestPermission(origin);

			if (granted) {
				const token = await fetchToken();

				tokenInputField.value = token;
				tokenInputField.dispatchEvent(new CustomEvent('change', {
					bubbles: true
				}));
			}
		}
	} catch (err) {
		console.error(err);
	}
});
