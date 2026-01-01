import apiClient from "@utils/apiClient";


interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: any;
    headers?: any;
    isNotShowError?: boolean;
}

interface Result<T = any> {
    data?: T;
    errors?: any[];
    isSuccess: boolean;
    status?: number
}

const pendingRequests = new Map<string, AbortController>();

const getPendingRequestKey = (url: string, method: string): string => {
    return `${method.toUpperCase()}_${url}`;
};

const addPendingRequest = (url: string, method: string): AbortSignal => {
    const key = getPendingRequestKey(url, method);

    if (pendingRequests.has(key)) {
        const oldController = pendingRequests.get(key);
        oldController?.abort();
    }

    const controller = new AbortController();
    pendingRequests.set(key, controller);
    return controller.signal;
};

const removePendingRequest = (url: string, method: string) => {
    const key = getPendingRequestKey(url, method);
    pendingRequests.delete(key);
};

const getDefaultHeaders = (additionalHeaders?: any): any => {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        ...additionalHeaders,
    };
};

const processQueryParams = (data: any): string => {
    if (!data) return '';

    const params = Object.entries(data)
        .map(([key, value]) => {
            if (value === null || value === undefined) return '';
            return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .filter((param) => param !== '')
        .join('&');

    return params ? `?${params}` : '';
};

class NetworkService {
    static async requestJson<T = any>(opts: RequestOptions): Promise<Result<T>> {
        try {
            const abortSignal = addPendingRequest(opts.url, opts.method);

            const headers = getDefaultHeaders(opts.headers);

            let url = opts.url;
            if (['GET', 'DELETE'].includes(opts.method) && opts.data) {
                const queryParams = processQueryParams(opts.data);
                url = opts.url + queryParams;
            }

            let response: any;

            switch (opts.method) {
                case 'GET':
                    response = await apiClient.get(url, {
                        headers,
                        signal: abortSignal,
                    });
                    break;

                case 'POST':
                    response = await apiClient.post(url, opts.data || {}, {
                        headers,
                        signal: abortSignal,
                    });
                    break;

                case 'PUT':
                    response = await apiClient.put(url, opts.data || {}, {
                        headers,
                        signal: abortSignal,
                    });
                    break;

                case 'PATCH':
                    response = await apiClient.patch(url, opts.data || {}, {
                        headers,
                        signal: abortSignal,
                    });
                    break;

                case 'DELETE':
                    response = await apiClient.delete(url, {
                        headers,
                        signal: abortSignal,
                    });
                    break;

                default:
                    throw new Error(`Unsupported HTTP method: ${opts.method}`);
            }

            removePendingRequest(opts.url, opts.method);

            const result: Result<T> = {
                data: response.data,
                errors: undefined,
                isSuccess: true,
            };

            return result;
        } catch (error: any) {
            removePendingRequest(opts.url, opts.method);
            return this.handleError(error, opts);
        }
    }

    private static handleError(error: any, opts: RequestOptions): Result<any> {
        if (error.name === 'AbortError') {
            console.warn(`[NETWORK] Request bị cancel: ${opts.method} ${opts.url}`);
            return {
                data: undefined,
                errors: ['Request bị cancel'],
                isSuccess: false,
            };
        }
        if (error.message === 'Network Error' || !error.response) {
            console.error('[NETWORK] Lỗi kết nối mạng:', error.message);
            return {
                data: undefined,
                errors: ['Lỗi kết nối mạng'],
                isSuccess: false,
            };
        }

        const status = error.response?.status;
        const responseData = error.response?.data;

        if (status === 401) {
            console.warn('[AUTH] Token hết hạn (401)');
            sessionStorage.clear();
            window.location.href = '/Main/Logout';
            return {
                data: undefined,
                errors: ['Token hết hạn'],
                isSuccess: false,
            };
        }

        if (status === 400) {
            console.error(`[API] Bad request (400): ${opts.method} ${opts.url}`, responseData);
            return {
                data: undefined,
                errors: [responseData?.message || 'Bad request'],
                isSuccess: false,
            };
        }

        if (status === 500) {
            console.error('[SERVER] Lỗi server (500):', responseData);
            return {
                data: undefined,
                errors: [responseData?.message || 'Lỗi server'],
                isSuccess: false,
            };
        }

        console.error(`[API] Lỗi ${status}: ${opts.method} ${opts.url}`, responseData);
        return {
            data: undefined,
            errors: [responseData?.message || `Lỗi ${status}`],
            isSuccess: false,
        };
    }
}

export default NetworkService;
