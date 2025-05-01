// A fake authentication service

type AuthService = {
	isAuthenticated: boolean;
	user: string | null;
	signin(callback: (user: string) => void): void;
	signout(callback: VoidFunction): void;
};

export const authService: AuthService = {
	isAuthenticated: false,
	user: null,

	signin(callback: (user: string) => void) {
		authService.isAuthenticated = true;
		// Simulate an asynchronous login
		setTimeout(() => {
			authService.user = 'user@example.com';
			callback(authService.user);
		}, 100);
	},

	signout(callback: VoidFunction) {
		authService.isAuthenticated = false;
		authService.user = null;
		// Simulate an asynchronous logout
		setTimeout(callback, 100);
	},
};
