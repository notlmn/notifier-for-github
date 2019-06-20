import {getHostname} from './lib/api';

export function isChrome() {
	return navigator.userAgent.includes('Chrome');
}

export async function isNotificationTargetPage(url) {
	const urlObject = new URL(url);

	if (urlObject.hostname !== await getHostname()) {
		return false;
	}

	const pathname = urlObject.pathname.replace(/^[/]|[/]$/g, ''); // Remove trailing and leading slashes

	// For https://github.com/notifications
	if (pathname === 'notifications') {
		return true;
	}

	const repoPath = pathname.split('/').slice(2).join('/'); // Everything after `user/repo`

	// Issue, PR, commit paths, and per-repo notifications
	return /^(((issues|pull)\/\d+(\/(commits|files))?)|(commit\/.*)|(notifications$))/.test(repoPath);
}
