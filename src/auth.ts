import { useCallback, useEffect, useState } from "react";

const EXPIRES_AT_COOKIE = "j26-auth_expires-at";

async function checkAuthStatus() {
	const response = await fetch("/auth/user");
	return await response.json();
}

async function callRefreshEndpoint() {
	await fetch("/auth/refresh");
}

function buildLoginUrl(path: string, redirectUri: string) {
	const url = new URL(path, window.location.origin);
	url.searchParams.set("redirect_uri", redirectUri);
	return url.toString();
}

function getExpiresAtFromCookie() {
	const match = document.cookie.match(
		new RegExp(`(^| )${EXPIRES_AT_COOKIE}=([^;]+)`),
	);
	if (match) {
		const expiresAt = parseInt(match[2], 10);
		if (!Number.isNaN(expiresAt)) {
			return expiresAt;
		}
	}
	return null;
}

export function useAuth() {
	const [loadingUser, setLoadingUser] = useState(true);
	const [user, setUser] = useState(null);
	const [expiresAt, setExpiresAt] = useState<number | null>(null);

	const getUser = useCallback(async () => {
		setLoadingUser(true);
		try {
			const data = await checkAuthStatus();
			setUser(data.user);
			setExpiresAt(getExpiresAtFromCookie());
		} finally {
			setLoadingUser(false);
		}
	}, []);

	const refresh = useCallback(async () => {
		await callRefreshEndpoint();
		await getUser();
	}, [getUser]);

	const updateRefreshExpiry = useCallback(() => {
		setExpiresAt(getExpiresAtFromCookie());
	}, []);

	const getLoginUrl = (redirectPath: string) => {
		const redirectUri = new URL(
			redirectPath,
			window.location.origin,
		).toString();
		return buildLoginUrl("/auth/login", redirectUri);
	};

	useEffect(() => {
		getUser().catch(() => {
			throw new Error("Failed to fetch auth status");
		});
	}, [getUser]);

	return {
		loadingUser,
		user,
		expiresAt,
		setExpiresAt,
		updateRefreshExpiry,
		refresh,
		getLoginUrl,
	};
}
