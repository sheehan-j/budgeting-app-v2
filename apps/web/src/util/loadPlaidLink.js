const PLAID_LINK_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

let plaidScriptPromise = null;

const attachScriptListeners = (script, resolve, reject) => {
	const handleLoad = () => {
		if (window.Plaid) {
			resolve(window.Plaid);
			return;
		}

		reject(new Error("Plaid Link loaded but was not initialized."));
	};

	const handleError = () => {
		reject(new Error("Failed to load Plaid Link."));
	};

	script.addEventListener("load", handleLoad, { once: true });
	script.addEventListener("error", handleError, { once: true });
};

export const loadPlaidLink = () => {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return Promise.reject(new Error("Plaid Link is only available in the browser."));
	}

	if (window.Plaid) {
		return Promise.resolve(window.Plaid);
	}

	if (!plaidScriptPromise) {
		plaidScriptPromise = new Promise((resolve, reject) => {
			const existingScript = document.querySelector(`script[src="${PLAID_LINK_SCRIPT_SRC}"]`);

			if (existingScript) {
				attachScriptListeners(existingScript, resolve, reject);
				return;
			}

			const script = document.createElement("script");
			script.src = PLAID_LINK_SCRIPT_SRC;
			script.async = true;
			attachScriptListeners(script, resolve, reject);
			document.body.appendChild(script);
		}).catch((error) => {
			plaidScriptPromise = null;
			throw error;
		});
	}

	return plaidScriptPromise;
};
