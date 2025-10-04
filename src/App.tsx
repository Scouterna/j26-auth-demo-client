import { useEffect, useState } from "react";
import { useAuth } from "./auth";

const useSecondsUntil = (timestamp: number) => {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		setSeconds(Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)));
		const interval = setInterval(() => {
			setSeconds(Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)));
		}, 1000);

		return () => clearInterval(interval);
	}, [timestamp]);

	return seconds;
};

const LinkButton = ({
	children,
	href,
	disabled,
}: {
	children: React.ReactNode;
	href: string;
	disabled?: boolean;
}) => {
	return (
		<a
			href={href}
			className={`
        px-4 py-2 bg-blue-500 text-white rounded [&:not([aria-disabled])]:hover:bg-blue-600
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
			aria-disabled={disabled}
			onClick={(e) => {
				if (disabled) {
					e.preventDefault();
				}
			}}
		>
			{children}
		</a>
	);
};

const Button = ({
	children,
	disabled,
	onClick,
}: {
	children: React.ReactNode;
	disabled?: boolean;
	onClick?: () => void;
}) => {
	return (
		<button
			type="button"
			className={`
        px-4 py-2 bg-blue-500 text-white rounded [&:not([aria-disabled])]:hover:bg-blue-600
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
			aria-disabled={disabled}
			onClick={(e) => {
				if (disabled) {
					e.preventDefault();
					return;
				}
				onClick?.();
			}}
		>
			{children}
		</button>
	);
};

const Switch = ({
	onChange,
	checked,
	children,
}: {
	onChange: (checked: boolean) => void;
	checked: boolean;
	children?: React.ReactNode;
}) => {
	return (
		<label className="flex items-center gap-2 cursor-pointer select-none">
			{children}

			<button
				type="button"
				role="switch"
				aria-checked={checked}
				onClick={() => onChange(!checked)}
				className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          ${checked ? "bg-blue-600" : "bg-gray-200"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
        `}
			>
				<span
					className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            ${checked ? "translate-x-6" : "translate-x-1"}
            transition-transform duration-200
          `}
				/>
			</button>
		</label>
	);
};

function App() {
	const {
		loadingUser,
		user,
		expiresAt,
		refresh,
		updateRefreshExpiry,
		getLoginUrl,
	} = useAuth();

	const [preventAutoRefresh, setPreventAutoRefresh] = useState(
		() => window.localStorage.getItem("preventAutoRefresh") === "true",
	);

	// const expiresIn = expiresAt ? Math.max(0, expiresAt - Date.now()) : null;
	const expiresIn = useSecondsUntil(expiresAt ?? 0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want this to run only when expiresIn changes
	useEffect(() => {
		updateRefreshExpiry();
	}, [expiresIn, updateRefreshExpiry]);

	useEffect(() => {
		// biome-ignore lint/suspicious/noExplicitAny: This is intentional
		(window as any).__j26PreventRefresh = preventAutoRefresh;
		window.localStorage.setItem(
			"preventAutoRefresh",
			preventAutoRefresh ? "true" : "false",
		);
	}, [preventAutoRefresh]);

	return (
		<main className="flex flex-col md:flex-row container mx-auto px-4 py-12 gap-4">
			<div className="flex-1 prose">
				<h1>J26 Authentication Demo</h1>
				<p>
					This page demonstrates how authentication works for services running
					in the J26 app.
				</p>

				<p>
					Start the authentication flow by clicking the "Sign in" button. This
					will redirect you to the Keycloak login page. If you're already signed
					in you will be immediately redirected back to this application. If not
					you will first be prompted for credentials. Once you arrive back at
					this application you should see your user information in the table.
				</p>

				<h2>Auto-refresh</h2>
				<p>
					The access tokens issued by Keycloak are short lived to improve
					security. To avoid having to sign in again every few minutes, the
					application can automatically refresh the session in the background by
					calling the refresh endpoint before the access token expires.
				</p>

				<p>
					To better demonstrate this, the access token lifetime for this demo
					has been lowered to 20 seconds. Normally the token would be valid for
					a few minutes.
				</p>

				<p>
					This page uses the auto-refresh script provided by the authentication
					helper service to keep the session alive. You can disable this
					behavior by toggling the Auto-refresh switch off. To use it in your
					own applications, include the script as such:
				</p>
				<pre>
					<code>{`<script src="/auth/static/refresh.js" async></script>`}</code>
				</pre>

				<p>
					If you try disabling the auto-refresh you will notice that your
					session will expire and not automatically refresh. You can manually
					refresh your session by clicking the "Refresh" button. This will call
					the refresh endpoint in the background without redirects which will
					extend your session if you're signed in.
				</p>

				<h2>Developing towards the authentication service</h2>

				<p>
					Because the authentication flow relies on cookies being availabile for
					both the authentication service and your application, you can't just
					call the authentication service directly when developing locally.
					Instead you must simluate the production setup where both your
					application and the authentication service are served from the same
					origin. This is most easily done by using a reverse proxy.
				</p>

				<p>
					If you're using Vite as your development server, you can use the
					built-in proxy functionality:
				</p>

				<pre>
					<code>{`import { defineConfig } from "vite";

export default defineConfig({
	plugins: [],
	server: {
		proxy: {
			"/auth": {
				target: "https://dev.j26.se/auth",
				changeOrigin: false,
			},
		},
	},
});
`}</code>
				</pre>

				<p>
					This will make it so that all requests to <code>/auth</code> and its
					subpaths will be forwarded to the authentication service, just like it
					will in production.
				</p>

				<p>
					If you're not using Vite, you may want to look into if your framework
					of choice has similar functionality or set up a reverse proxy using
					something like Nginx.
				</p>
			</div>

			<div className="flex-1 ">
				<div className="flex flex-col gap-4 items-center sticky top-12">
					<table className="border border-gray-300 w-full">
						<tbody className="divide-y divide-gray-300">
							<tr>
								<th className="text-left p-2 border border-gray-300">
									Loading
								</th>
								<td className="text-left p-2 border border-gray-300 w-full">
									{loadingUser ? "Yes" : "No"}
								</td>
							</tr>
							<tr>
								<th className="text-left p-2 border border-gray-300">
									Authenticated
								</th>
								<td className="text-left p-2 border border-gray-300 w-full">
									{user ? "Yes" : "No"}
								</td>
							</tr>
							<tr>
								<th className="text-left p-2 border border-gray-300">
									Expires at
								</th>
								<td className="text-left p-2 border border-gray-300 w-full">
									{expiresAt
										? new Date(expiresAt).toLocaleString("sv-SE")
										: "N/A"}
								</td>
							</tr>

							<tr>
								<th className="text-left p-2 border border-gray-300">
									Expires in
								</th>
								<td className="text-left p-2 border border-gray-300 w-full">
									{expiresAt ? `${Math.ceil(expiresIn)} seconds` : "N/A"}
								</td>
							</tr>

							<tr>
								<th className="text-left p-2 border border-gray-300">User</th>
								<td className="text-left p-2 border border-gray-300 w-full">
									<pre>{JSON.stringify(user, null, 2) || "N/A"}</pre>
								</td>
							</tr>
						</tbody>
					</table>

					<div className="flex gap-2 items-center flex-wrap">
						<LinkButton href={getLoginUrl("/")}>Sign in</LinkButton>
						{/* <LinkButton href="/auth/logout" disabled={!user}>
						Sign out
					</LinkButton> */}
						<Button onClick={refresh} disabled={!preventAutoRefresh}>
							Refresh
						</Button>
						<Switch
							checked={!preventAutoRefresh}
							onChange={() => {
								setPreventAutoRefresh(!preventAutoRefresh);
							}}
						>
							Auto-refresh
						</Switch>
					</div>
				</div>
			</div>
		</main>
	);
}

export default App;
