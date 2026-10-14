const API_BASE_URL = '/api/v1';

function getHeaders(options = {}) {

    const headers = {
        ...options.headers
    };

    const token =
        localStorage.getItem('access_token');

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    return headers;
}


function extractErrorMessage(result, fallbackMessage) {
    if (!result || typeof result !== 'object') {
        return fallbackMessage;
    }

    if (result.data && Array.isArray(result.data)) {
        const validationMessages = result.data
            .map(err => err.errorMessage || err.Message || err.message)
            .filter(Boolean);
        if (validationMessages.length > 0) {
            return validationMessages.join(', ');
        }
    }

    return result.message || result.errorMessage || fallbackMessage;
}

async function request(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...options.headers
    };

    const token = localStorage.getItem('access_token');
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (isMutating) {
        const csrfToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
        if (csrfToken) {
            headers['RequestVerificationToken'] = csrfToken;
        }
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            credentials: 'include',
            ...options,
            headers
        }
    );

    if (response.status === 401) {
        // logout / refresh token / redirect
        throw new Error('Unauthorized');
    }

    if (response.status === 403) {
        throw new Error('Forbidden');
    }

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const error = await response.json();
            message = extractErrorMessage(error, message);
        } catch {
            // Response wasn't JSON.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    let result;
    try {
        result = await response.json();
    } catch {
        return response;
    }

    if (result && typeof result === 'object' && result.hasOwnProperty('isSuccess')) {
        if (!result.isSuccess) {
            throw new Error(extractErrorMessage(result, 'Operation failed'));
        }
        return result.data;
    }

    return result;
}

export const http = {
    get(url, options = {}) {
        return request(url, {
            ...options,
            method: 'GET'
        });
    },

    post(url, body, options = {}) {
        return request(url, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    put(url, body, options = {}) {
        return request(url, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    delete(url, options = {}) {
        return request(url, {
            ...options,
            method: 'DELETE'
        });
    }
};