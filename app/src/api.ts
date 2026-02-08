import { PAYLOADS, ENHANCED_PAYLOADS, PayloadCategory } from './payloads';
import { WAFDetector, WAFDetectionResult } from './waf-detection';
import { PayloadEncoder, ProtocolManipulation } from './encoding';
import {
	generateWAFSpecificPayloads,
	generateHTTPManipulationPayloads,
	ADVANCED_PAYLOADS,
	generateEncodedPayloads,
} from './advanced-payloads';
import { HTTPManipulator, ManipulatedRequest, HTTPManipulationOptions } from './http-manipulation';

// --- Payload loading from GitHub ---
const GITHUB_PAYLOADS_URL = 'https://raw.githubusercontent.com/PAPAMICA/waf-payloads/refs/heads/main/payloads.json';
let payloadsLoaded = false;
let payloadsLoading: Promise<void> | null = null;

async function loadPayloadsFromGitHub(): Promise<void> {
	if (payloadsLoaded) return;
	if (payloadsLoading) return payloadsLoading;

	payloadsLoading = (async () => {
		try {
			console.log('Loading payloads from GitHub...');
			const resp = await fetch(GITHUB_PAYLOADS_URL);
			if (!resp.ok) throw new Error(`GitHub fetch failed: ${resp.status}`);
			const data: any = await resp.json();

			// Populate PAYLOADS (base + advanced merged)
			if (data.payloads) {
				for (const [key, value] of Object.entries(data.payloads)) {
					PAYLOADS[key] = value as PayloadCategory;
				}
			}
			if (data.advancedPayloads) {
				for (const [key, value] of Object.entries(data.advancedPayloads)) {
					PAYLOADS[key] = value as PayloadCategory;
					ADVANCED_PAYLOADS[key] = value as PayloadCategory;
				}
			}

			// Generate ENHANCED_PAYLOADS (all payloads + encoded variations)
			const allPayloads = { ...PAYLOADS };
			const encoded = generateEncodedPayloads(allPayloads);
			for (const [key, value] of Object.entries(allPayloads)) {
				ENHANCED_PAYLOADS[key] = value;
			}
			for (const [key, value] of Object.entries(encoded)) {
				ENHANCED_PAYLOADS[key] = value;
			}

			payloadsLoaded = true;
			const totalCategories = Object.keys(PAYLOADS).length;
			const totalPayloads = Object.values(PAYLOADS).reduce((s, c) => s + c.payloads.length, 0);
			console.log(`Payloads loaded: ${totalCategories} categories, ${totalPayloads} payloads`);
		} catch (e) {
			console.error('Failed to load payloads from GitHub:', e);
			payloadsLoading = null; // Allow retry on next request
		}
	})();

	return payloadsLoading;
}

// Вспомогательная функция для отправки запроса с нужным методом и payload
async function sendRequest(
	url: string,
	method: string,
	payload?: string,
	headersObj?: Record<string, string>,
	payloadTemplate?: string,
	followRedirect: boolean = false,
	useEnhancedPayloads: boolean = false,
	detectedWAF?: string,
	httpManipulation?: HTTPManipulationOptions,
) {
	try {
		let resp: Response;
		const headers = headersObj ? new Headers(headersObj) : undefined;
		const redirectOption = followRedirect ? 'follow' : 'manual';
		const startTime = Date.now();

		// Apply WAF-specific payload modifications if WAF is detected
		let finalPayload = payload;
		if (detectedWAF && payload) {
			const wafSpecificPayloads = generateWAFSpecificPayloads(detectedWAF, payload);
			if (wafSpecificPayloads.length > 1) {
				finalPayload = wafSpecificPayloads[1]; // Use first bypass variation
			}
		}

		switch (method) {
			case 'GET':
			case 'DELETE':
				resp = await fetch(finalPayload !== undefined ? url + `?test=${encodeURIComponent(finalPayload)}` : url, {
					method,
					redirect: redirectOption,
					headers,
				});
				break;
			case 'POST':
			case 'PUT':
				if (payloadTemplate) {
					let jsonObj;
					try {
						jsonObj = JSON.parse(payloadTemplate);
						jsonObj = substitutePayload(jsonObj, finalPayload ?? '');
					} catch {
						jsonObj = { test: finalPayload ?? '' };
					}
					resp = await fetch(url, {
						method,
						redirect: redirectOption,
						body: JSON.stringify(jsonObj),
						headers: new Headers({ ...(headersObj || {}), 'Content-Type': 'application/json' }),
					});
				} else {
					resp = await fetch(url, { method, redirect: redirectOption, body: new URLSearchParams({ test: finalPayload ?? '' }), headers });
				}
				break;
			default:
				return null;
		}

		const responseTime = Date.now() - startTime;
		console.log(
			`Request to ${url} with method ${method} and payload ${payload} and headers ${JSON.stringify(headersObj)} returned status ${resp.status} in ${responseTime}ms`,
		);

		return {
			status: resp.status,
			is_redirect: resp.status >= 300 && resp.status < 400,
			responseTime,
			response: resp,
		};
	} catch (e) {
		return { status: 'ERR', is_redirect: false, responseTime: 0 };
	}
}

// Лучше сразу загрузить index.html при старте (если возможно)
let INDEX_HTML = '';

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		const urlObj = new URL(request.url);

		// Load payloads from GitHub on first request (non-blocking for static assets)
		if (!payloadsLoaded && urlObj.pathname.startsWith('/api/')) {
			await loadPayloadsFromGitHub();
		} else if (!payloadsLoaded) {
			// Fire and forget for non-API requests
			loadPayloadsFromGitHub();
		}
		
		// Load index.html from assets if not already loaded
		if (urlObj.pathname === '/' && !INDEX_HTML && env?.ASSETS) {
			try {
				const asset = await env.ASSETS.fetch(new URL('/index.html', request.url));
				if (asset.ok) {
					INDEX_HTML = await asset.text();
				}
			} catch (e) {
				console.error('Error loading index.html from assets:', e);
			}
		}
		
		if (urlObj.pathname === '/') {
			// If INDEX_HTML is still empty, try to load from assets on each request
			if (!INDEX_HTML && env?.ASSETS) {
				try {
					const asset = await env.ASSETS.fetch(new URL('/index.html', request.url));
					if (asset.ok) {
						INDEX_HTML = await asset.text();
					}
				} catch (e) {
					console.error('Error loading index.html from assets:', e);
				}
			}
			return new Response(INDEX_HTML || 'WAF Checker - Loading...', { headers: { 'content-type': 'text/html; charset=UTF-8' } });
		}
		if (urlObj.pathname === '/api/payloads/status') {
			const totalCategories = Object.keys(PAYLOADS).length;
			const totalPayloads = Object.values(PAYLOADS).reduce((s, c) => s + c.payloads.length, 0);
			return new Response(JSON.stringify({
				loaded: payloadsLoaded,
				categories: totalCategories,
				totalPayloads: totalPayloads,
				source: 'github',
				url: GITHUB_PAYLOADS_URL,
			}), { headers: { 'content-type': 'application/json; charset=UTF-8' } });
		}
		if (urlObj.pathname === '/api/payloads') {
			return handleGetPayloads(urlObj);
		}
		if (urlObj.pathname === '/api/waf-detect') {
			return await handleWAFDetection(request);
		}
		if (urlObj.pathname === '/api/check-stream') {
			// New streaming endpoint with SSE
			return handleApiCheckStream(request);
		}
		if (urlObj.pathname === '/api/check') {
			const url = urlObj.searchParams.get('url');
			if (!url) return new Response('Missing url param', { status: 400 });
			if (url.includes('secmy')) {
				return new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json; charset=UTF-8' } });
			}
			const page = parseInt(urlObj.searchParams.get('page') || '0', 10);
			const methods = (urlObj.searchParams.get('methods') || 'GET')
				.split(',')
				.map((m) => m.trim())
				.filter(Boolean);
			const categoriesParam = urlObj.searchParams.get('categories');
			let categories: string[] | undefined = undefined;
			if (categoriesParam) {
				categories = categoriesParam
					.split(',')
					.map((c) => c.trim())
					.filter(Boolean);
			}
			let payloadTemplate: string | undefined = undefined;
			let customHeaders: string | undefined = undefined;
			let customPayloads: Record<string, { type: string; payloads: string[]; falsePayloads: string[] }> | undefined = undefined;
			if (request.method === 'POST') {
				try {
					const body: any = await request.json();
					if (body && typeof body.payloadTemplate === 'string') {
						payloadTemplate = body.payloadTemplate;
					}
					if (body && typeof body.customHeaders === 'string') {
						customHeaders = body.customHeaders;
					}
					if (body && typeof body.detectedWAF === 'string') {
						// detectedWAF can also come from request body
					}
					if (body && body.customPayloads && typeof body.customPayloads === 'object') {
						customPayloads = body.customPayloads;
					}
				} catch (e) {
					console.error('Error parsing request body:', e);
				}
			}
			// Новый параметр followRedirect
			const followRedirect = urlObj.searchParams.get('followRedirect') === '1';
			// Новый параметр falsePositiveTest
			const falsePositiveTest = urlObj.searchParams.get('falsePositiveTest') === '1';
			// New parameter caseSensitiveTest
			const caseSensitiveTest = urlObj.searchParams.get('caseSensitiveTest') === '1';
			// Enhanced payloads option
			const useEnhancedPayloads = urlObj.searchParams.get('enhancedPayloads') === '1';
			// Use advanced WAF bypass payloads
			const useAdvancedPayloads = urlObj.searchParams.get('useAdvancedPayloads') === '1';
			// Auto WAF detection
			const autoDetectWAF = urlObj.searchParams.get('autoDetectWAF') === '1';
			// Use encoding variations
			const useEncodingVariations = urlObj.searchParams.get('useEncodingVariations') === '1';
			// HTTP manipulation option
			const enableHTTPManipulation = urlObj.searchParams.get('httpManipulation') === '1';
			// Detected WAF type
			const detectedWAF = urlObj.searchParams.get('detectedWAF') || undefined;

			const results = await handleApiCheckFiltered(
				url,
				page,
				methods,
				categories,
				payloadTemplate,
				followRedirect,
				customHeaders,
				falsePositiveTest,
				caseSensitiveTest,
				useEnhancedPayloads,
				useAdvancedPayloads,
				autoDetectWAF,
				useEncodingVariations,
				detectedWAF,
				enableHTTPManipulation
					? {
							enableParameterPollution: true,
							enableVerbTampering: true,
							enableContentTypeConfusion: true,
						}
					: undefined,
				customPayloads,
			);
			return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json; charset=UTF-8' } });
		}
		if (urlObj.pathname === '/api/http-manipulation') {
			return await handleHTTPManipulation(request);
		}
		if (urlObj.pathname === '/api/batch/start') {
			return await handleBatchStart(request);
		}
		if (urlObj.pathname === '/api/batch/status') {
			return await handleBatchStatus(request);
		}
		if (urlObj.pathname === '/api/batch/stop') {
			return await handleBatchStop(request);
		}
		if (urlObj.pathname === '/api/security-headers') {
			return await handleSecurityHeaders(request);
		}
		if (urlObj.pathname === '/api/dns-recon') {
			return await handleDNSRecon(request);
		}
		if (urlObj.pathname === '/api/recon') {
			return await handleFullRecon(request);
		}
		return new Response('Not found', { status: 404 });
	},
};

// New streaming endpoint with parallelized requests
async function handleApiCheckStream(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	let url = urlObj.searchParams.get('url');
	if (!url) return new Response('Missing url param', { status: 400 });
	if (url.includes('secmy')) {
		return new Response('data: {"type":"complete","results":[]}\n\n', {
			headers: {
				'content-type': 'text/event-stream',
				'cache-control': 'no-cache',
				'connection': 'keep-alive',
			},
		});
	}

	const methods = (urlObj.searchParams.get('methods') || 'GET')
		.split(',')
		.map((m) => m.trim())
		.filter(Boolean);
	const categoriesParam = urlObj.searchParams.get('categories');
	let categories: string[] | undefined = undefined;
	if (categoriesParam) {
		categories = categoriesParam
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
	}

	let payloadTemplate: string | undefined = undefined;
	let customHeaders: string | undefined = undefined;
	let customPayloads: Record<string, { type: string; payloads: string[]; falsePayloads: string[] }> | undefined = undefined;
	if (request.method === 'POST') {
		try {
			const body: any = await request.json();
			if (body && typeof body.payloadTemplate === 'string') {
				payloadTemplate = body.payloadTemplate;
			}
			if (body && typeof body.customHeaders === 'string') {
				customHeaders = body.customHeaders;
			}
			if (body && body.customPayloads && typeof body.customPayloads === 'object') {
				customPayloads = body.customPayloads;
			}
		} catch (e) {
			console.error('Error parsing request body:', e);
		}
	}

	const followRedirect = urlObj.searchParams.get('followRedirect') === '1';
	const falsePositiveTest = urlObj.searchParams.get('falsePositiveTest') === '1';
	const caseSensitiveTest = urlObj.searchParams.get('caseSensitiveTest') === '1';
	const useEnhancedPayloads = urlObj.searchParams.get('enhancedPayloads') === '1';
	const useAdvancedPayloads = urlObj.searchParams.get('useAdvancedPayloads') === '1';
	const autoDetectWAF = urlObj.searchParams.get('autoDetectWAF') === '1';
	const useEncodingVariations = urlObj.searchParams.get('useEncodingVariations') === '1';
	const enableHTTPManipulation = urlObj.searchParams.get('httpManipulation') === '1';
	const detectedWAF = urlObj.searchParams.get('detectedWAF') || undefined;

	// Create a readable stream for SSE
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			
			const sendEvent = (type: string, data: any) => {
				const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
				controller.enqueue(encoder.encode(message));
			};

			try {
				// Get payload source
				let payloadSource: Record<string, PayloadCategory> = useEnhancedPayloads ? { ...ENHANCED_PAYLOADS } : { ...PAYLOADS };
				if (useAdvancedPayloads) {
					payloadSource = { ...payloadSource, ...ADVANCED_PAYLOADS };
				}
				if (useEncodingVariations) {
					const encodedPayloads = generateEncodedPayloads(payloadSource);
					payloadSource = { ...payloadSource, ...encodedPayloads };
				}

				// Merge custom payloads
				if (customPayloads && Object.keys(customPayloads).length > 0) {
					for (const [category, data] of Object.entries(customPayloads)) {
						if (data._deleted) continue; // Skip deleted categories
						if (payloadSource[category]) {
							const existingPayloads = payloadSource[category].payloads || [];
							const existingFalsePayloads = payloadSource[category].falsePayloads || [];
							const customPayloadsList = data.payloads || [];
							const customFalsePayloadsList = data.falsePayloads || [];
							const mergedPayloads = [...new Set([...existingPayloads, ...customPayloadsList])];
							const mergedFalsePayloads = [...new Set([...existingFalsePayloads, ...customFalsePayloadsList])];
							payloadSource[category] = {
								...payloadSource[category],
								payloads: mergedPayloads,
								falsePayloads: mergedFalsePayloads,
							};
						} else {
							payloadSource[category] = {
								type: data.type || 'ParamCheck',
								payloads: data.payloads || [],
								falsePayloads: data.falsePayloads || [],
							};
						}
					}
				}

				const payloadEntries =
					categories && categories.length
						? Object.entries(payloadSource).filter(([cat]) => categories.includes(cat))
						: Object.entries(payloadSource);

				// WAF detection if needed
				let wafDetectionResult: WAFDetectionResult | undefined;
				if (autoDetectWAF) {
					try {
						wafDetectionResult = await WAFDetector.activeDetection(url);
						sendEvent('waf-detected', { waf: wafDetectionResult });
					} catch (e) {
						console.error('WAF detection failed:', e);
					}
				}

				// Prepare all test requests
				const testRequests: Array<{
					category: string;
					payload: string;
					method: string;
					headersObj?: Record<string, string>;
					checkType: string;
				}> = [];

				let baseUrl: string;
				try {
					const u = new URL(url);
					baseUrl = `${u.protocol}//${u.host}`;
				} catch {
					baseUrl = url;
				}

				let originalUrl = url;
				if (caseSensitiveTest) {
					try {
						const u = new URL(url);
						const modifiedHostname = randomUppercase(u.hostname);
						u.hostname = modifiedHostname;
						url = u.toString();
						baseUrl = `${u.protocol}//${u.host}`;
					} catch (e) {
						url = randomUppercase(url);
						baseUrl = randomUppercase(baseUrl);
					}
				}

				const detectedWAFType = detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : undefined);

				// Build all test requests
				for (const [category, info] of payloadEntries) {
					const checkType = info.type || 'ParamCheck';
					const payloads = falsePositiveTest ? info.falsePayloads || [] : info.payloads || [];
					
					if (checkType === 'ParamCheck') {
						for (let payload of payloads) {
							if (caseSensitiveTest) {
								payload = randomUppercase(payload);
							}

							let payloadVariations = [payload];
							if (detectedWAFType) {
								const wafSpecificPayloads = generateWAFSpecificPayloads(detectedWAFType, payload);
								payloadVariations = wafSpecificPayloads.length > 1 ? wafSpecificPayloads : [payload];
							}
							if (useEncodingVariations && !detectedWAFType) {
								const encodedVariations = PayloadEncoder.generateBypassVariations(payload, category);
								payloadVariations = encodedVariations;
							}

							for (const currentPayload of payloadVariations) {
								for (const method of methods) {
									let headersObj = customHeaders ? processCustomHeaders(customHeaders, currentPayload) : undefined;
									let finalPayload = currentPayload;
									if (enableHTTPManipulation) {
										const pollutedPayloads = generateHTTPManipulationPayloads(currentPayload, 'pollution');
										if (pollutedPayloads.length > 1) {
											finalPayload = pollutedPayloads[1];
										}
									}
									testRequests.push({ category, payload: finalPayload, method, headersObj, checkType });
								}
							}
						}
					} else if (checkType === 'FileCheck') {
						for (let payload of payloads) {
							if (caseSensitiveTest) {
								payload = randomUppercase(payload);
							}
							const fileUrl = baseUrl.replace(/\/$/, '') + '/' + payload.replace(/^\//, '');
							const headersObj = customHeaders ? processCustomHeaders(customHeaders, payload) : undefined;
							testRequests.push({ category, payload: fileUrl, method: 'GET', headersObj, checkType });
						}
					} else if (checkType === 'Header') {
						for (let payload of payloads) {
							if (caseSensitiveTest) {
								payload = randomUppercase(payload);
							}
							const headersObj: Record<string, string> = {};
							for (const line of payload.split(/\r?\n/)) {
								const idx = line.indexOf(':');
								if (idx > 0) {
									const name = line.slice(0, idx).trim();
									const value = line.slice(idx + 1).trim();
									headersObj[name] = value;
								}
							}
							if (customHeaders) {
								const customHeadersObj = processCustomHeaders(customHeaders, payload);
								Object.assign(headersObj, customHeadersObj);
							}
							for (const method of methods) {
								testRequests.push({ category, payload, method, headersObj, checkType });
							}
						}
					}
				}

				// Send total count
				sendEvent('total', { count: testRequests.length });

				// Process requests in parallel batches
				const PARALLEL_BATCH_SIZE = 20; // Number of concurrent requests
				let completedCount = 0;

				for (let i = 0; i < testRequests.length; i += PARALLEL_BATCH_SIZE) {
					const batch = testRequests.slice(i, i + PARALLEL_BATCH_SIZE);
					
					// Execute batch in parallel
					const batchPromises = batch.map(async (req) => {
						try {
							let finalUrl = url;
							let finalMethod = req.method;
							let finalPayload = req.payload;

							if (req.checkType === 'FileCheck') {
								finalUrl = req.payload;
								finalPayload = undefined;
							}

							const res = await sendRequest(
								finalUrl,
								finalMethod,
								finalPayload,
								req.headersObj,
								payloadTemplate,
								followRedirect,
								useEnhancedPayloads,
								detectedWAFType,
							);

							const result = {
								category: req.category,
								payload: req.payload,
								method: req.method,
								status: res ? res.status : 'ERR',
								is_redirect: res ? res.is_redirect : false,
								responseTime: res ? res.responseTime : 0,
								wafDetected: wafDetectionResult?.detected || false,
								wafType: detectedWAFType || 'Unknown',
							};

							completedCount++;
							sendEvent('result', { result, completed: completedCount, total: testRequests.length });

							return result;
						} catch (e) {
							completedCount++;
							const errorResult = {
								category: req.category,
								payload: req.payload,
								method: req.method,
								status: 'ERR',
								is_redirect: false,
								responseTime: 0,
							};
							sendEvent('result', { result: errorResult, completed: completedCount, total: testRequests.length });
							return errorResult;
						}
					});

					await Promise.allSettled(batchPromises);
				}

				// Send completion
				sendEvent('complete', {});
				controller.close();
			} catch (error) {
				sendEvent('error', { message: error instanceof Error ? error.message : 'Unknown error' });
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			'connection': 'keep-alive',
		},
	});
}

async function handleApiCheckFiltered(
	url: string,
	page: number,
	methods: string[],
	categories?: string[],
	payloadTemplate?: string,
	followRedirect: boolean = false,
	customHeaders?: string,
	falsePositiveTest: boolean = false,
	caseSensitiveTest: boolean = false,
	useEnhancedPayloads: boolean = false,
	useAdvancedPayloads: boolean = false,
	autoDetectWAF: boolean = false,
	useEncodingVariations: boolean = false,
	detectedWAF?: string,
	httpManipulation?: HTTPManipulationOptions,
	customPayloads?: Record<string, { type: string; payloads: string[]; falsePayloads: string[] }>,
): Promise<any[]> {
	const METHODS = methods && methods.length ? methods : ['GET'];
	const results: any[] = [];
	let baseUrl: string;
	const limit = 50;
	const start = page * limit;
	const end = start + limit;
	let offset = 0;
	try {
		const u = new URL(url);
		baseUrl = `${u.protocol}//${u.host}`;
	} catch {
		baseUrl = url;
	}

	// Case sensitive test: Modify URL hostname if flag is set
	let originalUrl = url; // Keep original for potential error logging or if modification fails
	let originalBaseUrl = baseUrl; // Keep original baseUrl

	if (caseSensitiveTest) {
		try {
			const u = new URL(url);
			const modifiedHostname = randomUppercase(u.hostname);
			u.hostname = modifiedHostname;
			url = u.toString();
			baseUrl = `${u.protocol}//${u.host}`;
			console.log(`Case Sensitive Test: Modified URL from ${originalUrl} to ${url}`);
		} catch (e) {
			console.log(`Case Sensitive Test: Failed to parse URL ${originalUrl}, error: ${e}`);
			// Fallback: uppercase the whole URL and baseUrl string if parsing fails
			url = randomUppercase(url);
			baseUrl = randomUppercase(baseUrl);
			console.log(`Case Sensitive Test: Fallback - modified URL from ${originalUrl} to ${url}`);
		}
	}

	// Auto-detect WAF if requested
	let wafDetectionResult: WAFDetectionResult | undefined;
	if (autoDetectWAF) {
		try {
			wafDetectionResult = await WAFDetector.activeDetection(url);
			console.log(`WAF Detection Result: ${JSON.stringify(wafDetectionResult)}`);
		} catch (e) {
			console.error('WAF detection failed:', e);
		}
	}

	// Choose payload source based on options
	let payloadSource: Record<string, PayloadCategory> = useEnhancedPayloads ? { ...ENHANCED_PAYLOADS } : { ...PAYLOADS };

	// Add advanced payloads if requested
	if (useAdvancedPayloads) {
		payloadSource = { ...payloadSource, ...ADVANCED_PAYLOADS };
	}

	// Generate encoded payload variations if requested
	if (useEncodingVariations) {
		const encodedPayloads = generateEncodedPayloads(payloadSource);
		payloadSource = { ...payloadSource, ...encodedPayloads };
	}

	// Merge custom payloads if provided
	if (customPayloads && Object.keys(customPayloads).length > 0) {
		for (const [category, data] of Object.entries(customPayloads)) {
			if (payloadSource[category]) {
				// Merge with existing category: add custom payloads to existing ones
				const existingPayloads = payloadSource[category].payloads || [];
				const existingFalsePayloads = payloadSource[category].falsePayloads || [];
				const customPayloadsList = data.payloads || [];
				const customFalsePayloadsList = data.falsePayloads || [];
				
				// Create unique sets to avoid duplicates
				const mergedPayloads = [...new Set([...existingPayloads, ...customPayloadsList])];
				const mergedFalsePayloads = [...new Set([...existingFalsePayloads, ...customFalsePayloadsList])];
				
				payloadSource[category] = {
					...payloadSource[category],
					payloads: mergedPayloads,
					falsePayloads: mergedFalsePayloads,
				};
			} else {
				// New custom category
				payloadSource[category] = {
					type: data.type || 'ParamCheck',
					payloads: data.payloads || [],
					falsePayloads: data.falsePayloads || [],
				};
			}
		}
		console.log(`Merged custom payloads. Total categories: ${Object.keys(payloadSource).length}`);
	}

	const payloadEntries =
		categories && categories.length
			? Object.entries(payloadSource).filter(([cat]) => categories.includes(cat))
			: Object.entries(payloadSource);
	for (const [category, info] of payloadEntries) {
		const checkType = info.type || 'ParamCheck';
		const payloads = falsePositiveTest ? info.falsePayloads || [] : info.payloads || [];
		if (checkType === 'ParamCheck') {
			for (let payload of payloads) {
				// Use let so we can reassign
				if (caseSensitiveTest) {
					payload = randomUppercase(payload); // Modify payload
				}

				// Generate WAF-specific bypass variations if WAF is detected
				let payloadVariations = [payload];
				if (detectedWAF && wafDetectionResult?.detected) {
					const wafSpecificPayloads = generateWAFSpecificPayloads(wafDetectionResult.wafType, payload);
					payloadVariations = wafSpecificPayloads.length > 1 ? wafSpecificPayloads : [payload];
				} else if (detectedWAF) {
					const wafSpecificPayloads = generateWAFSpecificPayloads(detectedWAF, payload);
					payloadVariations = wafSpecificPayloads.length > 1 ? wafSpecificPayloads : [payload];
				}

				// Generate encoding variations if enabled
				if (useEncodingVariations && !detectedWAF) {
					const encodedVariations = PayloadEncoder.generateBypassVariations(payload, category);
					payloadVariations = encodedVariations;
				}

				// Test each payload variation
				for (const currentPayload of payloadVariations) {
					for (const method of METHODS) {
						if (offset >= end) return results;
						if (offset >= start) {
							// Process custom headers if provided
							let headersObj = customHeaders ? processCustomHeaders(customHeaders, currentPayload) : undefined;

							// Apply HTTP manipulation if enabled
							let finalPayload = currentPayload;
							let finalMethod = method;
							if (httpManipulation?.enableParameterPollution) {
								const pollutedPayloads = generateHTTPManipulationPayloads(currentPayload, 'pollution');
								if (pollutedPayloads.length > 1) {
									finalPayload = pollutedPayloads[1]; // Use first variation
								}
							}

							const detectedWAFType = detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : undefined);

							const res = await sendRequest(
								url,
								finalMethod,
								finalPayload,
								headersObj,
								payloadTemplate,
								followRedirect,
								useEnhancedPayloads,
								detectedWAFType,
							);
							results.push({
								category,
								payload: currentPayload,
								originalPayload: payload, // Keep track of original
								method,
								status: res ? res.status : 'ERR',
								is_redirect: res ? res.is_redirect : false,
								responseTime: res ? res.responseTime : 0,
								wafDetected: wafDetectionResult?.detected || false,
								wafType: detectedWAFType || 'Unknown',
								bypassTechnique: currentPayload !== payload ? 'Advanced' : 'Standard',
							});
						}
						offset++;
					}
				}
			}
		} else if (checkType === 'FileCheck') {
			for (let payload of payloads) {
				// Use let so we can reassign
				if (caseSensitiveTest) {
					payload = randomUppercase(payload); // Modify payload
				}
				if (offset >= end) return results;
				if (offset >= start) {
					// Use potentially modified baseUrl for the base, and modified payload for the file path
					const fileUrl = baseUrl.replace(/\/$/, '') + '/' + payload.replace(/^\//, '');
					// Process custom headers if provided
					const headersObj = customHeaders ? processCustomHeaders(customHeaders, payload) : undefined;
					const res = await sendRequest(
						fileUrl,
						'GET',
						undefined,
						headersObj,
						undefined,
						followRedirect,
						useEnhancedPayloads,
						detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : undefined),
					);
					results.push({
						category,
						payload,
						method: 'GET',
						status: res ? res.status : 'ERR',
						is_redirect: res ? res.is_redirect : false,
						responseTime: res ? res.responseTime : 0,
						wafDetected: wafDetectionResult?.detected || false,
						wafType: detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : 'Unknown'),
					});
				}
				offset++;
			}
		} else if (checkType === 'Header') {
			for (let payload of payloads) {
				// Use let so we can reassign
				if (caseSensitiveTest) {
					payload = randomUppercase(payload); // Modify payload
				}
				// Create headers from payload (potentially modified)
				const headersObj: Record<string, string> = {};
				for (const line of payload.split(/\r?\n/)) {
					// Use the potentially modified payload here
					const idx = line.indexOf(':');
					if (idx > 0) {
						const name = line.slice(0, idx).trim();
						const value = line.slice(idx + 1).trim();
						headersObj[name] = value;
					}
				}

				// Add custom headers if provided
				if (customHeaders) {
					const customHeadersObj = processCustomHeaders(customHeaders, payload);
					// Merge headers (custom headers override payload headers if same name)
					Object.assign(headersObj, customHeadersObj);
				}

				for (const method of METHODS) {
					if (offset >= end) return results;
					if (offset >= start) {
						const res = await sendRequest(
							url,
							method,
							undefined,
							headersObj,
							payloadTemplate,
							followRedirect,
							useEnhancedPayloads,
							detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : undefined),
						);
						results.push({
							category,
							payload,
							method,
							status: res ? res.status : 'ERR',
							is_redirect: res ? res.is_redirect : false,
							responseTime: res ? res.responseTime : 0,
							wafDetected: wafDetectionResult?.detected || false,
							wafType: detectedWAF || (wafDetectionResult?.detected ? wafDetectionResult.wafType : 'Unknown'),
						});
					}
					offset++;
				}
			}
		}
	}
	return results;
}

// New endpoint for HTTP manipulation testing
async function handleHTTPManipulation(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const targetUrl = urlObj.searchParams.get('url');

	if (!targetUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	try {
		const testPayload = 'test_payload';
		const manipulationOptions: HTTPManipulationOptions = {
			enableVerbTampering: true,
			enableParameterPollution: true,
			enableContentTypeConfusion: true,
			enableRequestSmuggling: false,
			enableHostHeaderInjection: true,
		};

		// Generate manipulated requests
		const manipulatedRequests = HTTPManipulator.generateManipulatedRequests(targetUrl, 'GET', testPayload, manipulationOptions);

		// Execute limited number of requests for testing
		const limitedRequests = manipulatedRequests.slice(0, 10);
		const results = await HTTPManipulator.batchExecuteRequests(limitedRequests, false, 3);

		return new Response(
			JSON.stringify({
				total_techniques: manipulatedRequests.length,
				tested_techniques: limitedRequests.length,
				results,
				timestamp: new Date().toISOString(),
			}),
			{
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'HTTP manipulation test failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			},
		);
	}
}

// Endpoint to get default payloads for configuration
function handleGetPayloads(urlObj: URL): Response {
	const category = urlObj.searchParams.get('category');
	const includeAdvanced = urlObj.searchParams.get('includeAdvanced') === '1';
	const includeEnhanced = urlObj.searchParams.get('includeEnhanced') === '1';

	// Combine all payload sources
	let allPayloads: Record<string, PayloadCategory> = { ...PAYLOADS };
	
	if (includeEnhanced) {
		allPayloads = { ...allPayloads, ...ENHANCED_PAYLOADS };
	}
	
	if (includeAdvanced) {
		allPayloads = { ...allPayloads, ...ADVANCED_PAYLOADS };
	}

	if (category) {
		// Return specific category
		const categoryData = allPayloads[category];
		if (!categoryData) {
			return new Response(JSON.stringify({ error: 'Category not found' }), {
				status: 404,
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			});
		}
		return new Response(
			JSON.stringify({
				category,
				type: categoryData.type,
				payloads: categoryData.payloads,
				falsePayloads: categoryData.falsePayloads,
			}),
			{ headers: { 'content-type': 'application/json; charset=UTF-8' } }
		);
	}

	// Return all categories with their payloads
	const result: Record<string, { type: string; payloads: string[]; falsePayloads: string[] }> = {};
	
	for (const [cat, data] of Object.entries(allPayloads)) {
		result[cat] = {
			type: data.type,
			payloads: data.payloads,
			falsePayloads: data.falsePayloads,
		};
	}

	return new Response(JSON.stringify(result), {
		headers: { 'content-type': 'application/json; charset=UTF-8' },
	});
}

// New endpoint for WAF detection
async function handleWAFDetection(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const targetUrl = urlObj.searchParams.get('url');

	if (!targetUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	try {
		const detection = await WAFDetector.activeDetection(targetUrl);
		const bypassOpportunities = await WAFDetector.detectBypassOpportunities(targetUrl);

		return new Response(
			JSON.stringify({
				detection,
				bypassOpportunities,
				timestamp: new Date().toISOString(),
			}),
			{
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			},
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'WAF detection failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			},
		);
	}
}

// Helper function to parse and process custom headers
function processCustomHeaders(customHeadersStr: string, payload?: string): Record<string, string> {
	const headersObj: Record<string, string> = {};
	if (!customHeadersStr || !customHeadersStr.trim()) return headersObj;

	for (const line of customHeadersStr.split(/\r?\n/)) {
		const idx = line.indexOf(':');
		if (idx > 0) {
			const name = line.slice(0, idx).trim();
			let value = line.slice(idx + 1).trim();
			// Replace {PAYLOAD} placeholder with actual payload
			if (payload && value.includes('{PAYLOAD}')) {
				value = value.replace(/\{PAYLOAD\}/g, payload);
			}
			headersObj[name] = value;
		}
	}
	return headersObj;
}

// Helper function to substitute payload in JSON template
function substitutePayload(obj: any, payload: string): any {
	if (typeof obj === 'string') {
		return obj.replace(/\{PAYLOAD\}/g, payload);
	} else if (Array.isArray(obj)) {
		return obj.map((item) => substitutePayload(item, payload));
	} else if (obj && typeof obj === 'object') {
		const result: any = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = substitutePayload(value, payload);
		}
		return result;
	}
	return obj;
}

// Helper function to randomly uppercase characters in a string
function randomUppercase(str: string): string {
	let result = '';
	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		// Randomly uppercase 50% of alphabetic characters
		if (char.match(/[a-zA-Z]/) && Math.random() > 0.5) {
			if (char === char.toLowerCase()) {
				result += char.toUpperCase();
			} else {
				result += char.toLowerCase();
			}
		} else {
			result += char;
		}
	}
	return result;
}

// Global batch state storage (in production, use a database or KV store)
const batchJobs = new Map<
	string,
	{
		id: string;
		status: 'running' | 'completed' | 'stopped' | 'error';
		progress: number;
		currentUrl: string;
		startTime: string;
		results: any[];
		error?: string;
		totalUrls: number;
		completedUrls: number;
	}
>();

// Cleanup old batch jobs periodically to prevent memory leaks
function cleanupOldBatchJobs() {
	const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

	for (const [jobId, job] of batchJobs.entries()) {
		const jobStartTime = new Date(job.startTime).getTime();
		if (jobStartTime < cutoffTime && job.status !== 'running') {
			batchJobs.delete(jobId);
			console.log(`Cleaned up old batch job: ${jobId}`);
		}
	}
}

async function handleBatchStart(request: Request): Promise<Response> {
	// Run cleanup on each batch start request
	cleanupOldBatchJobs();

	try {
		const body = await request.json();
		const { urls, config } = body;

		// Remove delay from config as it's handled client-side
		if (config && config.delayBetweenRequests) {
			delete config.delayBetweenRequests;
		}

		if (!urls || !Array.isArray(urls) || urls.length === 0) {
			return new Response(JSON.stringify({ error: 'No URLs provided' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		if (urls.length > 100) {
			return new Response(JSON.stringify({ error: 'Maximum 100 URLs allowed' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		// Validate URLs
		const validUrls: string[] = [];
		const invalidUrls: string[] = [];

		for (const url of urls) {
			try {
				const urlObj = new URL(url);
				// Check if protocol is HTTP or HTTPS
				if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
					invalidUrls.push(`${url} (unsupported protocol: ${urlObj.protocol})`);
				} else {
					validUrls.push(url);
				}
			} catch {
				invalidUrls.push(`${url} (invalid URL format)`);
			}
		}

		if (invalidUrls.length > 0) {
			return new Response(
				JSON.stringify({
					error: `Invalid URLs found: ${invalidUrls.join(', ')}`,
					validUrls: validUrls.length,
					invalidUrls: invalidUrls.length,
				}),
				{
					status: 400,
					headers: { 'content-type': 'application/json' },
				},
			);
		}

		if (validUrls.length === 0) {
			return new Response(JSON.stringify({ error: 'No valid URLs provided' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		const jobId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const startTime = new Date().toISOString();

		// Initialize batch job
		batchJobs.set(jobId, {
			id: jobId,
			status: 'running',
			progress: 0,
			currentUrl: '',
			startTime,
			results: [],
			totalUrls: validUrls.length,
			completedUrls: 0,
		});

		console.log(`Batch job ${jobId} initialized with ${validUrls.length} valid URLs (${invalidUrls.length} invalid URLs filtered out)`);

		// Start batch processing asynchronously
		processBatchAsync(jobId, validUrls, config || {});

		return new Response(
			JSON.stringify({
				jobId,
				status: 'started',
				totalUrls: validUrls.length,
				filteredUrls: invalidUrls.length,
			}),
			{
				headers: { 'content-type': 'application/json' },
			},
		);
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid request body' }), {
			status: 400,
			headers: { 'content-type': 'application/json' },
		});
	}
}

async function handleBatchStatus(request: Request): Promise<Response> {
	// Occasionally run cleanup on status requests (every ~20th request)
	if (Math.random() < 0.05) {
		cleanupOldBatchJobs();
	}

	const urlObj = new URL(request.url);
	const jobId = urlObj.searchParams.get('jobId');

	if (!jobId) {
		return new Response(JSON.stringify({ error: 'Missing jobId parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json' },
		});
	}

	const job = batchJobs.get(jobId);
	if (!job) {
		console.log(`Job ${jobId} not found. Available jobs:`, Array.from(batchJobs.keys()));
		return new Response(JSON.stringify({ error: 'Job not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' },
		});
	}

	console.log(`Status request for job ${jobId}:`, {
		progress: job.progress,
		completedUrls: job.completedUrls,
		totalUrls: job.totalUrls,
		currentUrl: job.currentUrl,
		status: job.status,
	});

	return new Response(JSON.stringify(job), {
		headers: { 'content-type': 'application/json' },
	});
}

async function handleBatchStop(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const jobId = urlObj.searchParams.get('jobId');

	if (!jobId) {
		return new Response(JSON.stringify({ error: 'Missing jobId parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json' },
		});
	}

	const job = batchJobs.get(jobId);
	if (!job) {
		return new Response(JSON.stringify({ error: 'Job not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' },
		});
	}

	if (job.status === 'running') {
		job.status = 'stopped';
		job.error = 'Stopped by user';
	}

	return new Response(JSON.stringify({ status: 'stopped' }), {
		headers: { 'content-type': 'application/json' },
	});
}

async function processBatchAsync(jobId: string, urls: string[], config: any) {
	const job = batchJobs.get(jobId);
	if (!job) return;

	const maxConcurrent = Math.min(config.maxConcurrent || 3, 5);
	let completedCount = 0;

	const semaphore = { permits: maxConcurrent, queue: [] as Array<() => void> };

	async function acquireSemaphore(): Promise<void> {
		if (semaphore.permits > 0) {
			semaphore.permits--;
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			semaphore.queue.push(resolve);
		});
	}

	function releaseSemaphore(): void {
		semaphore.permits++;
		if (semaphore.queue.length > 0) {
			const resolve = semaphore.queue.shift();
			if (resolve) {
				semaphore.permits--;
				resolve();
			}
		}
	}

	function updateProgress(currentUrl: string = '') {
		const currentJob = batchJobs.get(jobId);
		if (currentJob && currentJob.status === 'running') {
			currentJob.completedUrls = completedCount;
			currentJob.progress = Math.round((completedCount / urls.length) * 100);
			currentJob.currentUrl = currentUrl;
			console.log(`Batch ${jobId} progress: ${currentJob.progress}% (${completedCount}/${urls.length}) - ${currentUrl}`);
		}
	}

	const processUrl = async (url: string, index: number): Promise<string | null> => {
		const currentJob = batchJobs.get(jobId);
		if (!currentJob || currentJob.status !== 'running') return null;

		await acquireSemaphore();

		try {
			// Update current URL being processed
			updateProgress(url);

			// Delay is now handled on client-side

			const currentJobCheck = batchJobs.get(jobId);
			if (!currentJobCheck || currentJobCheck.status !== 'running') return null;

			// Run tests for this URL with timeout
			const urlResults = await Promise.race([
				testSingleUrlForBatch(url, config),
				new Promise<never>(
					(_, reject) => setTimeout(() => reject(new Error('URL test timeout')), 300000), // 5 minute timeout
				),
			]);

			const finalJob = batchJobs.get(jobId);
			if (finalJob && finalJob.status === 'running') {
				const resultEntry = {
					url,
					success: true,
					results: urlResults,
					timestamp: new Date().toISOString(),
					totalTests: urlResults.length,
					bypassedTests: urlResults.filter((r) => r.status === 200 || r.status === '200').length,
					bypassRate:
						urlResults.length > 0
							? Math.round((urlResults.filter((r) => r.status === 200 || r.status === '200').length / urlResults.length) * 100)
							: 0,
				};

				finalJob.results.push(resultEntry);
				completedCount++;
				updateProgress(url);
			}

			return url;
		} catch (error) {
			console.error(`Error processing URL ${url}:`, error);
			const errorJob = batchJobs.get(jobId);
			if (errorJob && errorJob.status === 'running') {
				errorJob.results.push({
					url,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
					timestamp: new Date().toISOString(),
					totalTests: 0,
					bypassedTests: 0,
					bypassRate: 0,
				});

				completedCount++;
				updateProgress(url);
			}
			return null;
		} finally {
			releaseSemaphore();
		}
	};

	try {
		const promises = urls.map((url, index) => processUrl(url, index));
		await Promise.allSettled(promises);

		const finalJob = batchJobs.get(jobId);
		if (finalJob) {
			finalJob.status = finalJob.status === 'running' ? 'completed' : finalJob.status;
			finalJob.progress = 100;
			finalJob.completedUrls = completedCount;
			finalJob.currentUrl = '';
			console.log(`Batch ${jobId} finished with status: ${finalJob.status}`);
		}
	} catch (error) {
		console.error(`Batch ${jobId} failed:`, error);
		const errorJob = batchJobs.get(jobId);
		if (errorJob) {
			errorJob.status = 'error';
			errorJob.error = error instanceof Error ? error.message : 'Unknown error';
		}
	}
}

async function testSingleUrlForBatch(url: string, config: any): Promise<any[]> {
	console.log(`Starting batch test for URL: ${url}`);
	const methods = config.methods || ['GET'];
	const categories = config.categories || ['SQL Injection', 'XSS'];

	let allResults: any[] = [];
	let page = 0;
	let maxPages = 10; // Limit to prevent infinite loops

	while (page < maxPages) {
		const params = new URLSearchParams({
			url,
			methods: methods.join(','),
			categories: categories.join(','),
			page: page.toString(),
			followRedirect: config.followRedirect ? '1' : '0',
			falsePositiveTest: config.falsePositiveTest ? '1' : '0',
			caseSensitiveTest: config.caseSensitiveTest ? '1' : '0',
			enhancedPayloads: config.enhancedPayloads ? '1' : '0',
			useAdvancedPayloads: config.useAdvancedPayloads ? '1' : '0',
			autoDetectWAF: config.autoDetectWAF ? '1' : '0',
			useEncodingVariations: config.useEncodingVariations ? '1' : '0',
			httpManipulation: config.httpManipulation ? '1' : '0',
		});

		try {
			const results = await handleApiCheckFiltered(
				url,
				page,
				methods,
				categories,
				config.payloadTemplate,
				config.followRedirect || false,
				config.customHeaders,
				config.falsePositiveTest || false,
				config.caseSensitiveTest || false,
				config.enhancedPayloads || false,
				config.useAdvancedPayloads || false,
				config.autoDetectWAF || false,
				config.useEncodingVariations || false,
				undefined,
				config.httpManipulation
					? {
							enableParameterPollution: true,
							enableVerbTampering: true,
							enableContentTypeConfusion: true,
						}
					: undefined,
			);

			if (!results || !results.length) {
				console.log(`No more results for ${url} at page ${page}`);
				break;
			}

			allResults = allResults.concat(results);
			console.log(`Batch test ${url}: page ${page} completed, ${results.length} results, total: ${allResults.length}`);
			page++;

			// Limit results to prevent memory issues
			if (allResults.length > 1000) {
				console.log(`Result limit reached for ${url}`);
				break;
			}
		} catch (error) {
			console.error(`Error testing ${url} at page ${page}:`, error);
			break;
		}
	}

	console.log(`Batch test completed for ${url}: ${allResults.length} total results`);
	return allResults;
}

// =============================================
// Security Headers Audit
// =============================================
const SECURITY_HEADERS: Record<string, { description: string; severity: 'critical' | 'high' | 'medium' | 'low'; recommendation: string }> = {
	'content-security-policy': {
		description: 'Controls resources the browser is allowed to load. Prevents XSS and data injection attacks.',
		severity: 'critical',
		recommendation: "Add a Content-Security-Policy header (e.g., default-src 'self'; script-src 'self')",
	},
	'strict-transport-security': {
		description: 'Forces HTTPS connections and prevents SSL stripping attacks.',
		severity: 'critical',
		recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
	},
	'x-frame-options': {
		description: 'Prevents clickjacking by controlling iframe embedding.',
		severity: 'high',
		recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN',
	},
	'x-content-type-options': {
		description: 'Prevents MIME-type sniffing attacks.',
		severity: 'medium',
		recommendation: 'Add X-Content-Type-Options: nosniff',
	},
	'referrer-policy': {
		description: 'Controls how much referrer information is shared with other sites.',
		severity: 'medium',
		recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin',
	},
	'permissions-policy': {
		description: 'Controls which browser features can be used (camera, mic, geolocation, etc.).',
		severity: 'medium',
		recommendation: 'Add Permissions-Policy: camera=(), microphone=(), geolocation=()',
	},
	'x-xss-protection': {
		description: 'Legacy XSS filter for older browsers. Modern CSP is preferred.',
		severity: 'low',
		recommendation: 'Add X-XSS-Protection: 1; mode=block (or rely on CSP)',
	},
	'cross-origin-opener-policy': {
		description: 'Prevents cross-origin windows from interacting with your page.',
		severity: 'medium',
		recommendation: 'Add Cross-Origin-Opener-Policy: same-origin',
	},
	'cross-origin-resource-policy': {
		description: 'Prevents other origins from reading your resources.',
		severity: 'medium',
		recommendation: 'Add Cross-Origin-Resource-Policy: same-origin',
	},
	'cross-origin-embedder-policy': {
		description: 'Controls cross-origin resource loading for added isolation.',
		severity: 'low',
		recommendation: 'Add Cross-Origin-Embedder-Policy: require-corp',
	},
};

const INFORMATION_DISCLOSURE_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-generator', 'x-drupal-cache', 'x-varnish'];

async function handleSecurityHeaders(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const targetUrl = urlObj.searchParams.get('url');

	if (!targetUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	try {
		// Validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(targetUrl);
			if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
				throw new Error('Invalid protocol');
			}
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
				status: 400,
				headers: { 'content-type': 'application/json; charset=UTF-8' },
			});
		}

		const startTime = Date.now();
		const resp = await fetch(targetUrl, {
			method: 'GET',
			redirect: 'follow',
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WAF-Checker/1.0)' },
		});
		const responseTime = Date.now() - startTime;

		const present: Array<{ header: string; value: string; description: string; severity: string }> = [];
		const missing: Array<{ header: string; description: string; severity: string; recommendation: string }> = [];
		const informationDisclosure: Array<{ header: string; value: string }> = [];

		// Check security headers
		for (const [header, info] of Object.entries(SECURITY_HEADERS)) {
			const value = resp.headers.get(header);
			if (value) {
				present.push({ header, value, description: info.description, severity: info.severity });
			} else {
				missing.push({ header, description: info.description, severity: info.severity, recommendation: info.recommendation });
			}
		}

		// Check information disclosure
		for (const header of INFORMATION_DISCLOSURE_HEADERS) {
			const value = resp.headers.get(header);
			if (value) {
				informationDisclosure.push({ header, value });
			}
		}

		// Calculate score
		const totalHeaders = Object.keys(SECURITY_HEADERS).length;
		const presentCount = present.length;
		const criticalMissing = missing.filter(h => h.severity === 'critical').length;
		const highMissing = missing.filter(h => h.severity === 'high').length;

		let score = Math.round((presentCount / totalHeaders) * 100);
		// Penalty for critical/high missing
		score = Math.max(0, score - (criticalMissing * 15) - (highMissing * 8));
		// Penalty for information disclosure
		score = Math.max(0, score - (informationDisclosure.length * 3));

		let grade: string;
		if (score >= 90) grade = 'A+';
		else if (score >= 80) grade = 'A';
		else if (score >= 70) grade = 'B';
		else if (score >= 55) grade = 'C';
		else if (score >= 40) grade = 'D';
		else grade = 'F';

		return new Response(
			JSON.stringify({
				url: targetUrl,
				status: resp.status,
				responseTime,
				score,
				grade,
				present,
				missing,
				informationDisclosure,
				totalChecked: totalHeaders,
				timestamp: new Date().toISOString(),
			}),
			{ headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: 'Security headers audit failed', message: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	}
}

// =============================================
// DNS Reconnaissance + WHOIS
// =============================================
const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];

async function resolveDNS(hostname: string, type: string): Promise<any[]> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);
		const resp = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`, {
			headers: { Accept: 'application/dns-json' },
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!resp.ok) return [];
		const data: any = await resp.json();
		return data.Answer || [];
	} catch {
		return [];
	}
}

function detectInfraFromRecords(records: Record<string, any[]>): Array<{ type: string; provider: string; evidence: string }> {
	const detected: Array<{ type: string; provider: string; evidence: string }> = [];
	const seen = new Set<string>();

	const patterns: Array<{ pattern: RegExp; provider: string; type: string }> = [
		{ pattern: /cloudflare/i, provider: 'Cloudflare', type: 'CDN/WAF' },
		{ pattern: /akamai|edgekey|edgesuite/i, provider: 'Akamai', type: 'CDN/WAF' },
		{ pattern: /fastly/i, provider: 'Fastly', type: 'CDN' },
		{ pattern: /amazonaws|aws|cloudfront/i, provider: 'AWS', type: 'Cloud/CDN' },
		{ pattern: /azure|microsoft/i, provider: 'Azure', type: 'Cloud' },
		{ pattern: /google|ghs\.googlehosted/i, provider: 'Google Cloud', type: 'Cloud' },
		{ pattern: /incapsula|imperva/i, provider: 'Imperva', type: 'WAF' },
		{ pattern: /sucuri/i, provider: 'Sucuri', type: 'WAF' },
		{ pattern: /stackpath|highwinds/i, provider: 'StackPath', type: 'CDN/WAF' },
		{ pattern: /ovh/i, provider: 'OVH', type: 'Hosting' },
		{ pattern: /hetzner/i, provider: 'Hetzner', type: 'Hosting' },
		{ pattern: /digitalocean/i, provider: 'DigitalOcean', type: 'Cloud' },
		{ pattern: /vercel/i, provider: 'Vercel', type: 'Platform' },
		{ pattern: /netlify/i, provider: 'Netlify', type: 'Platform' },
		{ pattern: /wpengine/i, provider: 'WP Engine', type: 'Hosting' },
	];

	for (const [type, answers] of Object.entries(records)) {
		for (const answer of answers) {
			const value = String(answer.data || '');
			for (const p of patterns) {
				if (p.pattern.test(value) && !seen.has(p.provider)) {
					seen.add(p.provider);
					detected.push({ type: p.type, provider: p.provider, evidence: `${type} record: ${value}` });
				}
			}
		}
	}

	return detected;
}

// =============================================
// Subdomain Discovery
// =============================================
const COMMON_SUBDOMAINS = [
	'www', 'mail', 'ftp', 'webmail', 'smtp', 'pop', 'imap', 'blog', 'forum',
	'shop', 'store', 'api', 'dev', 'staging', 'test', 'admin', 'portal',
	'vpn', 'remote', 'cdn', 'media', 'static', 'assets', 'img', 'images',
	'app', 'mobile', 'ns1', 'ns2', 'ns3', 'dns', 'dns1', 'dns2',
	'mx', 'mx1', 'mx2', 'email', 'cloud', 'git', 'gitlab', 'github',
	'jenkins', 'ci', 'cd', 'docker', 'k8s', 'registry', 'monitor',
	'grafana', 'prometheus', 'kibana', 'elastic', 'status', 'health',
	'docs', 'wiki', 'help', 'support', 'kb', 'intranet', 'internal',
	'crm', 'erp', 'sso', 'auth', 'login', 'oauth', 'id', 'identity',
	'db', 'database', 'mysql', 'postgres', 'redis', 'mongo', 'sql',
	'backup', 'bak', 'old', 'new', 'beta', 'alpha', 'demo', 'sandbox',
	'proxy', 'gateway', 'edge', 'lb', 'loadbalancer', 'cache',
	'ws', 'websocket', 'socket', 'realtime', 'live', 'streaming',
	'files', 'download', 'upload', 'storage', 's3',
	'web', 'www2', 'www3', 'secure', 'ssl', 'pay', 'payment', 'checkout',
	'cpanel', 'plesk', 'whm', 'panel', 'dashboard', 'manage',
	'autodiscover', 'autoconfig', 'webdisk', 'calendar', 'contacts',
];

async function discoverSubdomainsCT(domain: string): Promise<string[]> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 8000);
		const resp = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
			signal: controller.signal,
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WAF-Checker/1.0)' },
		});
		clearTimeout(timeout);
		if (!resp.ok) return [];
		const data: any[] = await resp.json();
		const subdomains = new Set<string>();
		for (const entry of data) {
			const name = String(entry.name_value || '').toLowerCase().trim();
			// Split multi-line entries (crt.sh sometimes returns \n-separated names)
			for (const n of name.split('\n')) {
				const clean = n.trim().replace(/^\*\./, '');
				if (clean && clean.endsWith(`.${domain}`) && clean !== domain && !clean.includes('*')) {
					subdomains.add(clean);
				}
			}
		}
		return Array.from(subdomains);
	} catch {
		return [];
	}
}

async function discoverSubdomainsBrute(domain: string): Promise<Array<{ subdomain: string; ip: string }>> {
	const found: Array<{ subdomain: string; ip: string }> = [];
	// Process in batches of 15 to avoid overwhelming DNS
	const batchSize = 15;
	for (let i = 0; i < COMMON_SUBDOMAINS.length; i += batchSize) {
		const batch = COMMON_SUBDOMAINS.slice(i, i + batchSize);
		const results = await Promise.allSettled(batch.map(async (sub) => {
			const fqdn = `${sub}.${domain}`;
			const records = await resolveDNS(fqdn, 'A');
			if (records.length > 0) {
				return { subdomain: fqdn, ip: records[0].data };
			}
			return null;
		}));
		for (const r of results) {
			if (r.status === 'fulfilled' && r.value) found.push(r.value);
		}
	}
	return found;
}

async function handleDNSRecon(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const targetUrl = urlObj.searchParams.get('url');

	if (!targetUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	let hostname: string;
	try {
		hostname = new URL(targetUrl).hostname;
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid URL' }), {
			status: 400,
			headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	// Extract the root domain (e.g. "sub.example.com" -> "example.com")
	const domainParts = hostname.split('.');
	const rootDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : hostname;

	try {
		// Run DNS resolution, WHOIS, reverse DNS, subdomain discovery, reverse IP, and domain RDAP in parallel
		const [dnsSettled, whoisSettled, ptrSettled, ctSubsSettled, bruteSubsSettled, reverseIpSettled, domainWhoisSettled] = await Promise.allSettled([
			// DNS records
			(async () => {
				const results = await Promise.allSettled(DNS_RECORD_TYPES.map(async (type) => {
					const records = await resolveDNS(hostname, type);
					return { type, records };
				}));
				const records: Record<string, any[]> = {};
				for (const r of results) {
					if (r.status === 'fulfilled' && r.value.records.length > 0) {
						records[r.value.type] = r.value.records;
					}
				}
				return records;
			})(),
			// WHOIS
			(async () => {
				const aRecords = await resolveDNS(hostname, 'A');
				if (aRecords.length === 0) return null;
				const ip = aRecords[0].data;
				const whoisResp = await fetchWithTimeout(`https://ipwho.is/${ip}`, {}, 5000);
				if (!whoisResp.ok) return null;
				const raw: any = await whoisResp.json();
				if (raw.success === false) return null;
				return {
					status: 'success',
					query: raw.ip || ip,
					country: raw.country || 'N/A',
					countryCode: raw.country_code || '',
					region: raw.region_code || '',
					regionName: raw.region || '',
					city: raw.city || '',
					zip: raw.postal || '',
					lat: raw.latitude || 0,
					lon: raw.longitude || 0,
					timezone: raw.timezone?.id || '',
					isp: raw.connection?.isp || '',
					org: raw.connection?.org || '',
					as: raw.connection?.asn ? `AS${raw.connection.asn}` : '',
					asname: raw.connection?.org || '',
					reverse: '',
				};
			})(),
			// Reverse DNS PTR
			(async () => {
				const aRecords = await resolveDNS(hostname, 'A');
				if (aRecords.length === 0) return null;
				return resolveReverseDNS(aRecords[0].data);
			})(),
			// Certificate Transparency subdomain discovery
			discoverSubdomainsCT(rootDomain),
			// DNS brute-force subdomain discovery
			discoverSubdomainsBrute(rootDomain),
			// Reverse IP lookup (other domains on same IP)
			(async () => {
				const aRecords = await resolveDNS(hostname, 'A');
				if (aRecords.length === 0) return [];
				return reverseIPLookup(aRecords[0].data);
			})(),
			// Domain WHOIS via RDAP — direct registry servers
			(async () => {
				try {
					const tld = rootDomain.split('.').pop()?.toLowerCase() || '';
					const rdapServers: Record<string, string> = {
						'com': 'https://rdap.verisign.com/com/v1/domain/',
						'net': 'https://rdap.verisign.com/net/v1/domain/',
						'org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
						'fr': 'https://rdap.nic.fr/domain/',
						'de': 'https://rdap.denic.de/domain/',
						'uk': 'https://rdap.nominet.uk/uk/domain/',
						'io': 'https://rdap.nic.io/domain/',
						'dev': 'https://rdap.nic.google/domain/',
						'app': 'https://rdap.nic.google/domain/',
						'eu': 'https://rdap.eu/domain/',
						'nl': 'https://rdap.sidn.nl/domain/',
						'be': 'https://rdap.dns.be/domain/',
						'ch': 'https://rdap.nic.ch/domain/',
						'it': 'https://rdap.nic.it/domain/',
						'es': 'https://rdap.nic.es/domain/',
						'pl': 'https://rdap.dns.pl/domain/',
						'se': 'https://rdap.iis.se/domain/',
						'br': 'https://rdap.registro.br/domain/',
						'au': 'https://rdap.auda.org.au/domain/',
						'jp': 'https://rdap.jprs.jp/domain/',
						'ru': 'https://rdap.tcinet.ru/domain/',
						'co': 'https://rdap.nic.co/domain/',
						'cc': 'https://rdap.verisign.com/cc/v1/domain/',
						'tv': 'https://rdap.verisign.com/tv/v1/domain/',
						'me': 'https://rdap.nic.me/domain/',
						'info': 'https://rdap.afilias.net/rdap/info/domain/',
						'xyz': 'https://rdap.nic.xyz/domain/',
					};
					let rdapResp: Response | null = null;
					const directUrl = rdapServers[tld];
					if (directUrl) {
						try {
							rdapResp = await fetchWithTimeout(`${directUrl}${encodeURIComponent(rootDomain)}`, {
								headers: { 'Accept': 'application/rdap+json, application/json' },
							}, 8000);
							if (!rdapResp.ok) rdapResp = null;
						} catch { rdapResp = null; }
					}
					if (!rdapResp) {
						try {
							const bootstrapResp = await fetchWithTimeout('https://data.iana.org/rdap/dns.json', {}, 5000);
							if (bootstrapResp.ok) {
								const bootstrap: any = await bootstrapResp.json();
								for (const entry of (bootstrap.services || [])) {
									const tlds: string[] = entry[0] || [];
									const urls: string[] = entry[1] || [];
									if (tlds.includes(tld) && urls.length > 0) {
										const baseUrl = urls[0].endsWith('/') ? urls[0] : urls[0] + '/';
										rdapResp = await fetchWithTimeout(`${baseUrl}domain/${encodeURIComponent(rootDomain)}`, {
											headers: { 'Accept': 'application/rdap+json, application/json' },
										}, 8000);
										if (!rdapResp.ok) rdapResp = null;
										break;
									}
								}
							}
						} catch { /* ignore */ }
					}
					if (!rdapResp || !rdapResp.ok) return null;
					const rdap: any = await rdapResp.json();

					// Helper: extract contact info from an entity's vcardArray
					// Clean URI prefixes from vCard values
					const cleanUri = (val: string | null): string | null => {
						if (!val) return null;
						return val.replace(/^(tel:|mailto:|sip:)/i, '').trim() || null;
					};

					const extractContact = (entity: any) => {
						const contact: Record<string, string | null> = { name: null, org: null, email: null, phone: null, address: null, country: null };
						if (!entity?.vcardArray?.[1]) return contact;
						for (const field of entity.vcardArray[1]) {
							const key = field[0];
							const val = field[3];
							if (key === 'fn') contact.name = (typeof val === 'string' ? val.trim() : null) || null;
							else if (key === 'org') {
								const orgVal = Array.isArray(val) ? val[0] : val;
								contact.org = (typeof orgVal === 'string' ? orgVal.trim() : null) || null;
							}
							else if (key === 'email') contact.email = cleanUri(typeof val === 'string' ? val : null);
							else if (key === 'tel') contact.phone = cleanUri(typeof val === 'string' ? val : (typeof val === 'object' && val?.uri ? val.uri : null));
							else if (key === 'adr') {
								const parts = Array.isArray(val) ? val : [];
								const addrParts = parts.filter((p: any) => p && typeof p === 'string' && p.trim());
								if (addrParts.length > 0) contact.address = addrParts.join(', ');
								if (parts.length >= 7 && parts[6] && typeof parts[6] === 'string') contact.country = parts[6].trim();
							}
						}
						if (!contact.name && entity.handle) contact.name = entity.handle;
						return contact;
					};

					let registrar: string | null = null;
					let registrant: Record<string, string | null> | null = null;
					let adminContact: Record<string, string | null> | null = null;
					let techContact: Record<string, string | null> | null = null;
					let abuseContact: Record<string, string | null> | null = null;

					const processEntities = (entities: any[]) => {
						for (const entity of entities) {
							const roles: string[] = entity.roles || [];
							if (roles.includes('registrar')) {
								registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3]
									|| entity.publicIds?.[0]?.identifier
									|| entity.handle
									|| null;
								if (entity.entities) {
									for (const sub of entity.entities) {
										if (sub.roles?.includes('abuse')) abuseContact = extractContact(sub);
									}
								}
							}
							if (roles.includes('registrant')) registrant = extractContact(entity);
							if (roles.includes('administrative')) adminContact = extractContact(entity);
							if (roles.includes('technical')) techContact = extractContact(entity);
							if (roles.includes('abuse') && !abuseContact) abuseContact = extractContact(entity);
						}
					};

					if (rdap.entities) processEntities(rdap.entities);

					// Extract dates from events
					let creationDate: string | null = null;
					let expirationDate: string | null = null;
					let lastChanged: string | null = null;
					if (rdap.events) {
						for (const ev of rdap.events) {
							if (ev.eventAction === 'registration') creationDate = ev.eventDate || null;
							else if (ev.eventAction === 'expiration') expirationDate = ev.eventDate || null;
							else if (ev.eventAction === 'last changed' || ev.eventAction === 'last update of RDAP database') lastChanged = ev.eventDate || null;
						}
					}

					// Extract status
					const status: string[] = rdap.status || [];

					// Extract nameservers from RDAP
					const rdapNameservers: string[] = (rdap.nameservers || []).map((ns: any) => String(ns.ldhName || '').toLowerCase()).filter((n: string) => n);

					// Domain name and handle
					const domainName = rdap.ldhName || rdap.handle || rootDomain;

					// DNSSEC
					const dnssec = rdap.secureDNS?.delegationSigned === true;

					// Clean up null-only contacts
					const isEmptyContact = (c: Record<string, string | null> | null) => !c || Object.values(c).every(v => !v);

					return {
						domainName,
						registrar,
						registrant: isEmptyContact(registrant) ? null : registrant,
						adminContact: isEmptyContact(adminContact) ? null : adminContact,
						techContact: isEmptyContact(techContact) ? null : techContact,
						abuseContact: isEmptyContact(abuseContact) ? null : abuseContact,
						creationDate,
						expirationDate,
						lastChanged,
						status,
						dnssec,
						rdapNameservers: rdapNameservers.length > 0 ? rdapNameservers : null,
					};
				} catch { return null; }
			})(),
		]);

		const dnsRecords = dnsSettled.status === 'fulfilled' ? dnsSettled.value : {};
		const whoisData = whoisSettled.status === 'fulfilled' ? whoisSettled.value : null;
		const reverseDns = ptrSettled.status === 'fulfilled' ? ptrSettled.value : null;
		const reverseIpDomains = reverseIpSettled.status === 'fulfilled' ? reverseIpSettled.value : [];
		const domainWhois = domainWhoisSettled.status === 'fulfilled' ? domainWhoisSettled.value : null;

		// Merge subdomains from CT and brute-force
		const ctSubdomains = ctSubsSettled.status === 'fulfilled' ? ctSubsSettled.value : [];
		const bruteSubdomains = bruteSubsSettled.status === 'fulfilled' ? bruteSubsSettled.value : [];

		// Build unified subdomain list with IPs
		const subdomainMap = new Map<string, string>();
		for (const brute of bruteSubdomains) {
			subdomainMap.set(brute.subdomain, brute.ip);
		}
		for (const ctSub of ctSubdomains) {
			if (!subdomainMap.has(ctSub)) subdomainMap.set(ctSub, '');
		}
		const subdomains = Array.from(subdomainMap.entries())
			.map(([name, ip]) => ({ name, ip, source: bruteSubdomains.some(b => b.subdomain === name) ? (ctSubdomains.includes(name) ? 'DNS + CT' : 'DNS') : 'CT' }))
			.sort((a, b) => a.name.localeCompare(b.name));

		// Detect infrastructure from DNS records
		const infrastructure = detectInfraFromRecords(dnsRecords);

		// Extract IPs
		const aRecords = dnsRecords['A'] || [];
		const ipAddresses = aRecords.map((r: any) => r.data);
		const aaaaRecords = dnsRecords['AAAA'] || [];
		const ipv6Addresses = aaaaRecords.map((r: any) => r.data);

		// Nameservers
		const nsRecords = dnsRecords['NS'] || [];
		const nameservers = nsRecords.map((r: any) => String(r.data).replace(/\.$/, ''));

		// MX
		const mxRecords = dnsRecords['MX'] || [];
		const mailServers = mxRecords.map((r: any) => {
			const parts = String(r.data).split(' ');
			return { priority: parseInt(parts[0]) || 0, server: (parts[1] || '').replace(/\.$/, '') };
		}).sort((a: any, b: any) => a.priority - b.priority);

		// TXT
		const txtRecords = dnsRecords['TXT'] || [];
		const txtValues = txtRecords.map((r: any) => String(r.data).replace(/^"|"$/g, ''));

		// Email security
		const spfRecord = txtValues.find((t: string) => t.startsWith('v=spf1'));
		const dmarcRecords = await resolveDNS(`_dmarc.${hostname}`, 'TXT');
		const dmarcRecord = dmarcRecords.length > 0 ? String(dmarcRecords[0].data).replace(/^"|"$/g, '') : null;

		// Add PTR to whois if available
		if (whoisData && reverseDns) whoisData.reverse = reverseDns;

		return new Response(
			JSON.stringify({
				hostname,
				rootDomain,
				ipAddresses,
				ipv6Addresses,
				reverseDns,
				nameservers,
				mailServers,
				txtRecords: txtValues,
				dnsRecords,
				infrastructure,
				domainWhois,
				whois: whoisData,
				subdomains,
				subdomainStats: {
					total: subdomains.length,
					fromCT: ctSubdomains.length,
					fromDNS: bruteSubdomains.length,
				},
				reverseIpDomains,
				emailSecurity: {
					spf: spfRecord || null,
					dmarc: dmarcRecord || null,
					hasSPF: !!spfRecord,
					hasDMARC: !!dmarcRecord,
				},
				timestamp: new Date().toISOString(),
			}),
			{ headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: 'DNS reconnaissance failed', message: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	}
}

// =============================================
// Full Reconnaissance
// =============================================

// Technology detection patterns from response headers and HTML
const TECH_PATTERNS: Array<{ name: string; category: string; detect: (headers: Headers, html: string, url: string) => string | null }> = [
	// CMS
	{ name: 'WordPress', category: 'CMS', detect: (h, html) => {
		if (html.includes('wp-content') || html.includes('wp-includes') || html.includes('wp-json')) return 'HTML patterns (wp-content/wp-includes)';
		if (h.get('x-powered-by')?.toLowerCase().includes('wordpress')) return 'X-Powered-By header';
		if (h.get('link')?.includes('wp-json')) return 'REST API link header';
		return null;
	}},
	{ name: 'Drupal', category: 'CMS', detect: (h, html) => {
		if (h.get('x-drupal-cache') || h.get('x-generator')?.toLowerCase().includes('drupal')) return 'Drupal headers';
		if (html.includes('Drupal.settings') || html.includes('/sites/default/files')) return 'HTML patterns';
		return null;
	}},
	{ name: 'Joomla', category: 'CMS', detect: (h, html) => {
		if (html.includes('/media/jui/') || html.includes('Joomla!') || html.includes('/administrator/')) return 'HTML patterns';
		if (h.get('x-content-encoded-by')?.includes('Joomla')) return 'X-Content-Encoded-By header';
		return null;
	}},
	{ name: 'Shopify', category: 'CMS/E-commerce', detect: (h, html) => {
		if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) return 'HTML patterns';
		if (h.get('x-shopid') || h.get('x-shardid')) return 'Shopify headers';
		return null;
	}},
	{ name: 'Magento', category: 'CMS/E-commerce', detect: (h, html) => {
		if (html.includes('Mage.Cookies') || html.includes('/skin/frontend/') || html.includes('magento')) return 'HTML patterns';
		if (h.get('set-cookie')?.includes('frontend=')) return 'Magento cookie';
		return null;
	}},
	{ name: 'PrestaShop', category: 'CMS/E-commerce', detect: (h, html) => {
		if (html.includes('prestashop') || html.includes('/modules/ps_') || html.includes('PrestaShop')) return 'HTML patterns';
		return null;
	}},
	{ name: 'Ghost', category: 'CMS', detect: (h, html) => {
		if (html.includes('ghost-') || h.get('x-powered-by')?.includes('Ghost')) return 'Ghost patterns';
		return null;
	}},
	{ name: 'Wix', category: 'Website Builder', detect: (h, html) => {
		if (html.includes('wix.com') || html.includes('X-Wix-')) return 'HTML/header patterns';
		return null;
	}},
	{ name: 'Squarespace', category: 'Website Builder', detect: (h, html) => {
		if (html.includes('squarespace.com') || html.includes('Squarespace')) return 'HTML patterns';
		return null;
	}},
	{ name: 'Webflow', category: 'Website Builder', detect: (h, html) => {
		if (html.includes('webflow.com') || html.includes('wf-') || h.get('x-powered-by')?.includes('Webflow')) return 'Webflow patterns';
		return null;
	}},
	// Frameworks
	{ name: 'Next.js', category: 'Framework', detect: (h, html) => {
		if (h.get('x-powered-by')?.includes('Next.js') || html.includes('__NEXT_DATA__') || html.includes('/_next/')) return 'Next.js patterns';
		return null;
	}},
	{ name: 'Nuxt.js', category: 'Framework', detect: (h, html) => {
		if (html.includes('__NUXT__') || html.includes('/_nuxt/')) return 'Nuxt patterns';
		return null;
	}},
	{ name: 'React', category: 'Frontend', detect: (h, html) => {
		if (html.includes('__REACT_') || html.includes('react-root') || html.includes('data-reactroot')) return 'React markers';
		return null;
	}},
	{ name: 'Vue.js', category: 'Frontend', detect: (h, html) => {
		if (html.includes('__vue__') || html.includes('data-v-') || html.includes('vue.')) return 'Vue.js markers';
		return null;
	}},
	{ name: 'Angular', category: 'Frontend', detect: (h, html) => {
		if (html.includes('ng-version') || html.includes('ng-app') || html.includes('angular')) return 'Angular markers';
		return null;
	}},
	{ name: 'Laravel', category: 'Framework', detect: (h, html) => {
		if (h.get('set-cookie')?.includes('laravel_session')) return 'Laravel session cookie';
		if (html.includes('csrf-token') && html.includes('Laravel')) return 'HTML patterns';
		return null;
	}},
	{ name: 'Django', category: 'Framework', detect: (h, html) => {
		if (h.get('set-cookie')?.includes('csrftoken') && h.get('set-cookie')?.includes('sessionid')) return 'Django cookies';
		return null;
	}},
	{ name: 'Ruby on Rails', category: 'Framework', detect: (h, html) => {
		if (h.get('x-powered-by')?.includes('Phusion') || h.get('set-cookie')?.includes('_rails_')) return 'Rails patterns';
		return null;
	}},
	{ name: 'Express.js', category: 'Framework', detect: (h) => {
		if (h.get('x-powered-by')?.includes('Express')) return 'X-Powered-By: Express';
		return null;
	}},
	{ name: 'ASP.NET', category: 'Framework', detect: (h, html) => {
		if (h.get('x-aspnet-version') || h.get('x-powered-by')?.includes('ASP.NET')) return 'ASP.NET headers';
		if (html.includes('__VIEWSTATE') || html.includes('__EVENTVALIDATION')) return 'ASP.NET HTML patterns';
		return null;
	}},
	{ name: 'PHP', category: 'Language', detect: (h) => {
		if (h.get('x-powered-by')?.toLowerCase().includes('php')) return `X-Powered-By: ${h.get('x-powered-by')}`;
		if (h.get('set-cookie')?.includes('PHPSESSID')) return 'PHPSESSID cookie';
		return null;
	}},
	// Servers
	{ name: 'Nginx', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('nginx')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'Apache', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('apache')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'LiteSpeed', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('litespeed')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'IIS', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('iis') || server.toLowerCase().includes('microsoft')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'Caddy', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('caddy')) return `Server: ${server}`;
		return null;
	}},
	// CDN/Infra
	// NOTE: Cloudflare detection is handled separately in Full Recon to cross-reference with DNS.
	// For standalone tech detection, require strong signals only (not cf-ray alone, which can be injected by Worker proxy).
	{ name: 'Cloudflare', category: 'CDN/WAF', detect: (h, html) => {
		const server = h.get('server')?.toLowerCase() || '';
		const hasCfServer = server.includes('cloudflare');
		const hasCfCacheStatus = !!h.get('cf-cache-status');
		const hasCfRay = !!h.get('cf-ray');
		const hasCloudflareHTML = html.includes('challenges.cloudflare.com') || html.includes('__cf_bm') || html.includes('cf-browser-verification');
		// Require server:cloudflare + at least one more indicator, or HTML evidence
		if (hasCfServer && (hasCfRay || hasCfCacheStatus)) return `Server: cloudflare + ${hasCfCacheStatus ? 'cf-cache-status' : 'cf-ray'}`;
		if (hasCloudflareHTML) return 'Cloudflare challenge/scripts in HTML';
		// cf-ray alone is NOT enough (Cloudflare Workers add it to all proxied responses)
		return null;
	}},
	{ name: 'Akamai', category: 'CDN', detect: (h) => {
		if (h.get('x-akamai-transformed') || h.get('server')?.toLowerCase().includes('akamai')) return 'Akamai headers';
		return null;
	}},
	{ name: 'Fastly', category: 'CDN', detect: (h) => {
		if (h.get('x-served-by')?.includes('cache-') || h.get('via')?.includes('varnish') && h.get('x-fastly-request-id')) return 'Fastly headers';
		return null;
	}},
	{ name: 'Vercel', category: 'Platform', detect: (h) => {
		if (h.get('x-vercel-id') || h.get('server')?.toLowerCase().includes('vercel')) return 'Vercel headers';
		return null;
	}},
	{ name: 'Netlify', category: 'Platform', detect: (h) => {
		if (h.get('x-nf-request-id') || h.get('server')?.toLowerCase().includes('netlify')) return 'Netlify headers';
		return null;
	}},
	// Analytics
	{ name: 'Google Analytics', category: 'Analytics', detect: (h, html) => {
		if (html.includes('google-analytics.com') || html.includes('gtag(') || html.includes('googletagmanager.com') || html.includes('GA_TRACKING_ID')) return 'GA scripts';
		return null;
	}},
	{ name: 'Matomo/Piwik', category: 'Analytics', detect: (h, html) => {
		if (html.includes('matomo') || html.includes('piwik')) return 'Matomo/Piwik scripts';
		return null;
	}},
	// Security
	{ name: 'reCAPTCHA', category: 'Security', detect: (h, html) => {
		if (html.includes('recaptcha') || html.includes('google.com/recaptcha')) return 'reCAPTCHA scripts';
		return null;
	}},
	{ name: 'hCaptcha', category: 'Security', detect: (h, html) => {
		if (html.includes('hcaptcha.com') || html.includes('h-captcha')) return 'hCaptcha scripts';
		return null;
	}},
	{ name: 'Turnstile', category: 'Security', detect: (h, html) => {
		if (html.includes('challenges.cloudflare.com/turnstile') || html.includes('cf-turnstile')) return 'Turnstile widget';
		return null;
	}},
	// More CMS
	{ name: 'TYPO3', category: 'CMS', detect: (h, html) => {
		if (html.includes('typo3') || html.includes('TYPO3') || h.get('x-generator')?.includes('TYPO3')) return 'TYPO3 patterns';
		return null;
	}},
	{ name: 'Hugo', category: 'CMS', detect: (h, html) => {
		if (html.includes('Hugo') && html.includes('generator') || html.includes('/hugo')) return 'Hugo patterns';
		return null;
	}},
	{ name: 'Gatsby', category: 'Framework', detect: (h, html) => {
		if (html.includes('gatsby') || html.includes('___gatsby') || h.get('x-powered-by')?.includes('Gatsby')) return 'Gatsby patterns';
		return null;
	}},
	{ name: 'Svelte/SvelteKit', category: 'Framework', detect: (h, html) => {
		if (html.includes('__sveltekit') || html.includes('svelte') || h.get('x-sveltekit-page')) return 'SvelteKit patterns';
		return null;
	}},
	{ name: 'Remix', category: 'Framework', detect: (h, html) => {
		if (html.includes('__remix') || html.includes('remix-run')) return 'Remix patterns';
		return null;
	}},
	{ name: 'Astro', category: 'Framework', detect: (h, html) => {
		if (html.includes('astro-') || html.match(/data-astro-/)) return 'Astro patterns';
		return null;
	}},
	// More servers / platforms
	{ name: 'Envoy', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('envoy')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'OpenResty', category: 'Web Server', detect: (h) => {
		const server = h.get('server') || '';
		if (server.toLowerCase().includes('openresty')) return `Server: ${server}`;
		return null;
	}},
	{ name: 'AWS', category: 'Platform', detect: (h) => {
		if (h.get('x-amz-request-id') || h.get('x-amzn-requestid') || h.get('server')?.includes('AmazonS3') || h.get('x-amz-cf-id')) return 'AWS headers';
		return null;
	}},
	{ name: 'Google Cloud', category: 'Platform', detect: (h) => {
		if (h.get('x-cloud-trace-context') || h.get('server')?.includes('Google') || h.get('via')?.includes('google')) return 'GCP headers';
		return null;
	}},
	{ name: 'Azure', category: 'Platform', detect: (h) => {
		if (h.get('x-azure-ref') || h.get('x-ms-request-id') || h.get('server')?.includes('Microsoft-Azure')) return 'Azure headers';
		return null;
	}},
	// More analytics
	{ name: 'Hotjar', category: 'Analytics', detect: (h, html) => {
		if (html.includes('hotjar.com') || html.includes('_hjSettings')) return 'Hotjar scripts';
		return null;
	}},
	{ name: 'Microsoft Clarity', category: 'Analytics', detect: (h, html) => {
		if (html.includes('clarity.ms') || html.includes('clarity(')) return 'Clarity scripts';
		return null;
	}},
	{ name: 'Plausible', category: 'Analytics', detect: (h, html) => {
		if (html.includes('plausible.io')) return 'Plausible scripts';
		return null;
	}},
	{ name: 'Umami', category: 'Analytics', detect: (h, html) => {
		if (html.includes('umami.') || html.includes('data-website-id')) return 'Umami scripts';
		return null;
	}},
	// Optimization & Performance
	{ name: 'Varnish', category: 'Cache', detect: (h) => {
		if (h.get('via')?.toLowerCase().includes('varnish') || h.get('x-varnish')) return 'Varnish headers';
		return null;
	}},
	{ name: 'WP Rocket', category: 'Cache', detect: (h, html) => {
		if (html.includes('wp-rocket') || html.includes('wprocket') || h.get('x-powered-by')?.includes('Starter')) return 'WP Rocket patterns';
		return null;
	}},
	{ name: 'LiteSpeed Cache', category: 'Cache', detect: (h, html) => {
		if (h.get('x-litespeed-cache') || html.includes('litespeed-cache')) return 'LiteSpeed Cache headers';
		return null;
	}},
	{ name: 'WP Super Cache', category: 'Cache', detect: (h, html) => {
		if (html.includes('wp-super-cache') || html.includes('supercache')) return 'WP Super Cache patterns';
		return null;
	}},
	{ name: 'W3 Total Cache', category: 'Cache', detect: (h, html) => {
		if (html.includes('w3-total-cache') || html.includes('W3 Total Cache')) return 'W3TC patterns';
		return null;
	}},
	// E-commerce
	{ name: 'WooCommerce', category: 'E-commerce', detect: (h, html) => {
		if (html.includes('woocommerce') || html.includes('wc-') || html.includes('WooCommerce')) return 'WooCommerce patterns';
		return null;
	}},
	// SEO
	{ name: 'Yoast SEO', category: 'SEO', detect: (h, html) => {
		if (html.includes('yoast') || html.includes('Yoast SEO')) return 'Yoast SEO comments/patterns';
		return null;
	}},
	{ name: 'Rank Math', category: 'SEO', detect: (h, html) => {
		if (html.includes('rank-math') || html.includes('Rank Math')) return 'Rank Math patterns';
		return null;
	}},
	// Fonts
	{ name: 'Google Fonts', category: 'Font', detect: (h, html) => {
		if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) return 'Google Fonts CDN';
		return null;
	}},
	{ name: 'Adobe Fonts', category: 'Font', detect: (h, html) => {
		if (html.includes('use.typekit.net') || html.includes('adobe') && html.includes('font')) return 'Adobe Fonts/Typekit';
		return null;
	}},
	// Chat / Support
	{ name: 'Intercom', category: 'Chat', detect: (h, html) => {
		if (html.includes('intercom') || html.includes('Intercom')) return 'Intercom widget';
		return null;
	}},
	{ name: 'Crisp', category: 'Chat', detect: (h, html) => {
		if (html.includes('crisp.chat') || html.includes('$crisp')) return 'Crisp widget';
		return null;
	}},
	{ name: 'Zendesk', category: 'Chat', detect: (h, html) => {
		if (html.includes('zendesk') || html.includes('zdassets.com')) return 'Zendesk widget';
		return null;
	}},
	{ name: 'Tawk.to', category: 'Chat', detect: (h, html) => {
		if (html.includes('tawk.to') || html.includes('Tawk_API')) return 'Tawk.to widget';
		return null;
	}},
	// Marketing
	{ name: 'Facebook Pixel', category: 'Marketing', detect: (h, html) => {
		if (html.includes('fbq(') || html.includes('facebook.com/tr') || html.includes('fbevents.js')) return 'FB Pixel scripts';
		return null;
	}},
	{ name: 'Google Ads', category: 'Marketing', detect: (h, html) => {
		if (html.includes('googleads') || html.includes('adsbygoogle') || html.includes('pagead2')) return 'Google Ads scripts';
		return null;
	}},
];

// =============================================
// Reverse DNS (PTR) lookup
// =============================================
async function resolveReverseDNS(ip: string): Promise<string | null> {
	try {
		const parts = ip.split('.');
		if (parts.length !== 4) return null;
		const reversed = parts.reverse().join('.') + '.in-addr.arpa';
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);
		const resp = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(reversed)}&type=PTR`, {
			headers: { Accept: 'application/dns-json' },
			signal: controller.signal,
		});
		clearTimeout(timeout);
		if (!resp.ok) return null;
		const data: any = await resp.json();
		if (data.Answer && data.Answer.length > 0) {
			return String(data.Answer[0].data).replace(/\.$/, '');
		}
		return null;
	} catch {
		return null;
	}
}

// =============================================
// Reverse IP Lookup (domains on same IP)
// =============================================
async function reverseIPLookup(ip: string): Promise<string[]> {
	const allDomains = new Set<string>();

	// Strategy 1: HackerTarget API (plain text, one domain per line)
	try {
		const resp = await fetchWithTimeout(
			`https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`,
			{ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
			5000,
		);
		if (resp.ok) {
			const text = await resp.text();
			if (text && !text.includes('error') && !text.includes('API count exceeded') && !text.includes('No DNS A records')) {
				for (const line of text.split('\n')) {
					const d = line.trim().toLowerCase();
					if (d && d.includes('.') && !d.includes(' ') && !d.includes('<')) {
						allDomains.add(d);
					}
				}
			}
		}
	} catch { /* ignore */ }

	// Strategy 2: rapiddns.io HTML scraping (if strategy 1 returned nothing)
	if (allDomains.size === 0) {
		try {
			const resp = await fetchWithTimeout(
				`https://rapiddns.io/s/${encodeURIComponent(ip)}?full=1`,
				{ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
				6000,
			);
			if (resp.ok) {
				const html = await resp.text();
				// Extract domains from table cells: <td>domain.com</td>
				const tdRegex = /<td>([a-z0-9][\w.-]*\.[a-z]{2,})<\/td>/gi;
				let match: RegExpExecArray | null;
				while ((match = tdRegex.exec(html)) !== null) {
					const d = match[1].toLowerCase();
					if (d.includes('.') && !d.match(/^\d+\.\d+\.\d+\.\d+$/)) {
						allDomains.add(d);
					}
				}
			}
		} catch { /* ignore */ }
	}

	return [...allDomains];
}

// =============================================
// CMS Deep Analysis (plugins, themes, versions)
// =============================================
function extractCMSDetails(html: string, headers: Headers) {
	const result: {
		cmsName: string | null;
		plugins: Array<{ slug: string; name: string; version: string | null }>;
		themes: Array<{ slug: string; name: string; version: string | null; active: boolean }>;
	} = { cmsName: null, plugins: [], themes: [] };

	// Known page builders / NOT CMS (should not be reported as the main CMS)
	const PAGE_BUILDERS = ['elementor', 'divi', 'beaver builder', 'wpbakery', 'oxygen', 'bricks', 'brizy', 'thrive', 'seedprod', 'spectra'];

	// Detect WordPress FIRST via HTML patterns (most reliable)
	const isWP = html.includes('wp-content') || html.includes('wp-includes');
	if (isWP) {
		result.cmsName = 'WordPress';
	}

	// Parse generator for other CMS (only if not already detected as WP)
	if (!result.cmsName) {
		const genMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["']/i)
			|| html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']generator["']/i);
		if (genMatch) {
			const raw = genMatch[1].trim();
			if (/^Drupal/i.test(raw)) { result.cmsName = 'Drupal'; }
			else if (/^Joomla/i.test(raw)) { result.cmsName = 'Joomla'; }
			else {
				// Other generators (but skip page builders)
				const genericVer = raw.match(/^([\w.\-/]+)/);
				if (genericVer && !PAGE_BUILDERS.some(pb => genericVer[1].toLowerCase().includes(pb))) {
					result.cmsName = genericVer[1];
				}
			}
		}
	}

	// WordPress specific extraction
	if (isWP) {

		// Extract plugins: /wp-content/plugins/SLUG/
		const pluginMap = new Map<string, string | null>();
		const pluginRegex = /\/wp-content\/plugins\/([a-zA-Z0-9_-]+)\/?[^"']*?(?:\?ver=([\d.]+))?/g;
		let m: RegExpExecArray | null;
		while ((m = pluginRegex.exec(html)) !== null) {
			const slug = m[1];
			const ver = m[2] || null;
			if (!pluginMap.has(slug) || (ver && !pluginMap.get(slug))) {
				pluginMap.set(slug, ver);
			}
		}
		// Also try ver= in same tag for plugins without inline ver
		const pluginTagRegex = /\/wp-content\/plugins\/([a-zA-Z0-9_-]+)\/[^"']*["'][^>]*$/gm;
		// Second pass: look for ver= following the plugin URL in the same tag
		const tagRegex = /<(?:script|link)[^>]*\/wp-content\/plugins\/([a-zA-Z0-9_-]+)\/[^"']*(?:\?[^"']*ver=([\d.]+))?[^>]*>/gi;
		while ((m = tagRegex.exec(html)) !== null) {
			const slug = m[1];
			const ver = m[2] || null;
			if (!pluginMap.has(slug) || (ver && !pluginMap.get(slug))) {
				pluginMap.set(slug, ver);
			}
		}
		for (const [slug, ver] of pluginMap) {
			const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
			result.plugins.push({ slug, name, version: ver });
		}
		result.plugins.sort((a, b) => a.name.localeCompare(b.name));

		// Extract themes: /wp-content/themes/SLUG/
		const themeMap = new Map<string, string | null>();
		const themeRegex = /\/wp-content\/themes\/([a-zA-Z0-9_-]+)\/?[^"']*?(?:\?ver=([\d.]+))?/g;
		while ((m = themeRegex.exec(html)) !== null) {
			const slug = m[1];
			const ver = m[2] || null;
			if (!themeMap.has(slug) || (ver && !themeMap.get(slug))) {
				themeMap.set(slug, ver);
			}
		}
		let isFirst = true;
		for (const [slug, ver] of themeMap) {
			const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
			result.themes.push({ slug, name, version: ver, active: isFirst });
			isFirst = false;
		}
	}

	// Drupal modules
	if (html.includes('/modules/') && (html.includes('drupal') || html.includes('Drupal'))) {
		const drupalModRegex = /\/modules\/(?:contrib\/)?([a-zA-Z0-9_-]+)\/[^"']*?(?:\?[^"']*v=([\d.]+))?/g;
		let m2: RegExpExecArray | null;
		const modMap = new Map<string, string | null>();
		while ((m2 = drupalModRegex.exec(html)) !== null) {
			const slug = m2[1];
			if (['system', 'core', 'node', 'user', 'field'].includes(slug)) continue;
			if (!modMap.has(slug)) modMap.set(slug, m2[2] || null);
		}
		for (const [slug, ver] of modMap) {
			const name = slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
			result.plugins.push({ slug, name, version: ver });
		}
	}

	return result;
}

// =============================================
// Extract JS libraries with versions
// =============================================
function extractJSLibraries(html: string): Array<{ name: string; version: string | null; evidence: string }> {
	const libs: Array<{ name: string; version: string | null; evidence: string }> = [];
	const found = new Set<string>();

	const patterns: Array<{ name: string; regex: RegExp; verGroup?: number }> = [
		{ name: 'jQuery', regex: /jquery[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'jQuery Migrate', regex: /jquery-migrate[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'jQuery UI', regex: /jquery-ui[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Bootstrap', regex: /bootstrap[.-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'Font Awesome', regex: /font-?awesome[/-]?([\d.]+)?/i, verGroup: 1 },
		{ name: 'Lodash', regex: /lodash[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Moment.js', regex: /moment[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Axios', regex: /axios[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'GSAP', regex: /gsap[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Swiper', regex: /swiper[/-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'Slick', regex: /slick[.-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'AOS', regex: /aos[.-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'Owl Carousel', regex: /owl[.-]?carousel[.-]?([\d.]+)?/i, verGroup: 1 },
		{ name: 'Lightbox', regex: /lightbox[.-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'Select2', regex: /select2[.-]?([\d.]+)?(?:\.min)?\.(?:js|css)/i, verGroup: 1 },
		{ name: 'DataTables', regex: /dataTables[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Chart.js', regex: /chart[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Three.js', regex: /three[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'D3.js', regex: /d3[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'TailwindCSS', regex: /tailwind[.-]?([\d.]+)?(?:\.min)?\.css/i, verGroup: 1 },
		{ name: 'Alpine.js', regex: /alpine[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'htmx', regex: /htmx[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Turbo', regex: /turbo[.-]?([\d.]+)?(?:\.min)?\.js/i, verGroup: 1 },
		{ name: 'Elementor', regex: /elementor[/-]?([\d.]+)?/i, verGroup: 1 },
	];

	for (const pat of patterns) {
		const match = html.match(pat.regex);
		if (match) {
			if (found.has(pat.name)) continue;
			found.add(pat.name);
			const ver = pat.verGroup && match[pat.verGroup] ? match[pat.verGroup] : null;
			libs.push({ name: pat.name, version: ver, evidence: match[0].substring(0, 80) });
		}
	}

	// Try to extract jQuery version from inline code
	if (!found.has('jQuery')) {
		const jqInline = html.match(/jquery[\/\s]+([\d.]+)/i);
		if (jqInline) {
			found.add('jQuery');
			libs.push({ name: 'jQuery', version: jqInline[1], evidence: jqInline[0] });
		}
	}

	return libs;
}

// =============================================
// Extract Open Graph + social metadata
// =============================================
function extractOpenGraph(html: string): Record<string, string> {
	const og: Record<string, string> = {};
	const ogRegex = /<meta[^>]*(?:property|name)=["'](og:|twitter:)([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
	let m: RegExpExecArray | null;
	while ((m = ogRegex.exec(html)) !== null) {
		og[m[1] + m[2]] = m[3];
	}
	// Reverse attribute order
	const ogRegex2 = /<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](og:|twitter:)([^"']*)["']/gi;
	while ((m = ogRegex2.exec(html)) !== null) {
		if (!og[m[2] + m[3]]) og[m[2] + m[3]] = m[1];
	}
	return og;
}

// =============================================
// Extract page metadata
// =============================================
function extractPageMeta(html: string): {
	language: string | null; canonical: string | null; favicon: string | null;
	feeds: Array<{ type: string; href: string }>; emails: string[];
} {
	const langMatch = html.match(/<html[^>]*\slang=["']([^"']*)["']/i);
	const canonMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
		|| html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
	const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)
		|| html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

	const feeds: Array<{ type: string; href: string }> = [];
	const feedRegex = /<link[^>]*rel=["']alternate["'][^>]*type=["'](application\/(?:rss|atom)\+xml)["'][^>]*href=["']([^"']*)["']/gi;
	let m: RegExpExecArray | null;
	while ((m = feedRegex.exec(html)) !== null) {
		feeds.push({ type: m[1].includes('atom') ? 'Atom' : 'RSS', href: m[2] });
	}

	// Extract emails (simple regex, deduplicate)
	const emailSet = new Set<string>();
	const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
	while ((m = emailRegex.exec(html)) !== null) {
		const email = m[0].toLowerCase();
		if (!email.includes('example.') && !email.includes('wixpress') && !email.includes('schema.org') && !email.includes('sentry.')) {
			emailSet.add(email);
		}
	}

	return {
		language: langMatch ? langMatch[1] : null,
		canonical: canonMatch ? canonMatch[1] : null,
		favicon: faviconMatch ? faviconMatch[1] : null,
		feeds,
		emails: Array.from(emailSet).slice(0, 20),
	};
}

// Common paths to probe for technology fingerprinting
const PROBE_PATHS = [
	{ path: '/robots.txt', name: 'robots.txt' },
	{ path: '/sitemap.xml', name: 'sitemap.xml' },
	{ path: '/wp-login.php', name: 'WordPress Login' },
	{ path: '/wp-json/', name: 'WordPress REST API' },
	{ path: '/administrator/', name: 'Joomla Admin' },
	{ path: '/user/login', name: 'Drupal Login' },
	{ path: '/.well-known/security.txt', name: 'security.txt' },
	{ path: '/favicon.ico', name: 'Favicon' },
];

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const resp = await fetch(url, { ...options, signal: controller.signal });
		return resp;
	} finally {
		clearTimeout(timeout);
	}
}

async function handleFullRecon(request: Request): Promise<Response> {
	const urlObj = new URL(request.url);
	const targetUrl = urlObj.searchParams.get('url');

	if (!targetUrl) {
		return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
			status: 400, headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	let parsedTarget: URL;
	try {
		parsedTarget = new URL(targetUrl);
		if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') throw new Error('Invalid protocol');
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid URL' }), {
			status: 400, headers: { 'content-type': 'application/json; charset=UTF-8' },
		});
	}

	const baseUrl = `${parsedTarget.protocol}//${parsedTarget.host}`;
	const hostname = parsedTarget.hostname;
	const reconDomainParts = hostname.split('.');
	const reconRootDomain = reconDomainParts.length > 2 ? reconDomainParts.slice(-2).join('.') : hostname;

	// Result containers with defaults (so partial results still work)
	let mainResponseTime = 0;
	let mainHtml = '';
	let mainHeaders: Headers = new Headers();
	let mainStatus = 0;
	const responseHeaders: Record<string, string> = {};
	const technologies: Array<{ name: string; category: string; evidence: string }> = [];
	let pageInfo: any = { title: null, description: null, generator: null, generatorFull: null, statusCode: 0, contentType: '', contentLength: '0' };
	let dnsRecords: Record<string, any[]> = {};
	let ipAddresses: string[] = [];
	let ipv6Addresses: string[] = [];
	let nameservers: string[] = [];
	let infrastructure: Array<{ type: string; provider: string; evidence: string }> = [];
	let whoisData: any = null;
	let reverseDns: string | null = null;
	let probeResults: Array<{ path: string; name: string; status: number; exists: boolean; contentType?: string; snippet?: string }> = [];
	const cookies: Array<{ name: string; flags: string[] }> = [];
	let cmsDetails: any = { cmsName: null, plugins: [], themes: [] };
	let jsLibraries: Array<{ name: string; version: string | null; evidence: string }> = [];
	let openGraph: Record<string, string> = {};
	let pageMeta: any = { language: null, canonical: null, favicon: null, feeds: [], emails: [] };
	let sslCertificate: any = null;
	let reverseIpDomains: string[] = [];
	let subdomains: Array<{ name: string; ip: string; source: string }> = [];
	let subdomainStats: any = { total: 0, fromCT: 0, fromDNS: 0 };
	let mailServers: Array<{ priority: number; server: string }> = [];
	let txtValues: string[] = [];
	let emailSecurity: any = { spf: null, dmarc: null, hasSPF: false, hasDMARC: false };

	try {
		// === ALL PHASES IN PARALLEL: Page fetch + DNS + WHOIS/PTR + Probes + SSL Cert + Reverse IP ===
		const [pageResult, dnsResult, whoisPtrResult, probesResult, sslResult, reverseIpResult, domainRdapResult, ctSubsResult, bruteSubsResult, dmarcResult] = await Promise.allSettled([
			// Phase 1: Main page fetch (5s timeout)
			(async () => {
				const startTime = Date.now();
				const mainResp = await fetchWithTimeout(targetUrl, {
					method: 'GET', redirect: 'follow',
					headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
				}, 5000);
				const rt = Date.now() - startTime;
				const html = await mainResp.text();
				const hdrs: Record<string, string> = {};
				mainResp.headers.forEach((v, k) => { hdrs[k] = v; });
				return { responseTime: rt, html, headers: mainResp.headers, rawHeaders: hdrs, status: mainResp.status };
			})(),
			// Phase 2: DNS (3s per record)
			(async () => {
				const dnsTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'];
				const results = await Promise.allSettled(dnsTypes.map(async (type) => {
					const records = await resolveDNS(hostname, type);
					return { type, records };
				}));
				const records: Record<string, any[]> = {};
				for (const r of results) {
					if (r.status === 'fulfilled' && r.value.records.length > 0) {
						records[r.value.type] = r.value.records;
					}
				}
				return records;
			})(),
			// Phase 3: WHOIS + Reverse DNS PTR (3s each)
			(async () => {
				const aRecords = await resolveDNS(hostname, 'A');
				if (aRecords.length === 0) return { whois: null, ptr: null };
				const ip = aRecords[0].data;
				const [whoisSettled, ptrSettled] = await Promise.allSettled([
					(async () => {
						const whoisResp = await fetchWithTimeout(`https://ipwho.is/${ip}`, {}, 3000);
						if (!whoisResp.ok) return null;
						const raw: any = await whoisResp.json();
						if (raw.success === false) return null;
						return {
							ip: raw.ip || ip, country: raw.country || 'N/A', countryCode: raw.country_code || '',
							region: raw.region || '', city: raw.city || '', isp: raw.connection?.isp || '',
							org: raw.connection?.org || '', asn: raw.connection?.asn ? `AS${raw.connection.asn}` : '',
							asnOrg: raw.connection?.org || '',
						};
					})(),
					resolveReverseDNS(ip),
				]);
				return {
					whois: whoisSettled.status === 'fulfilled' ? whoisSettled.value : null,
					ptr: ptrSettled.status === 'fulfilled' ? ptrSettled.value : null,
				};
			})(),
			// Phase 4: Probes (HEAD for most, GET only for text files, 3s timeout)
			Promise.allSettled(PROBE_PATHS.map(async (probe) => {
				const needsBody = probe.path === '/robots.txt' || probe.path === '/.well-known/security.txt';
				try {
					const probeResp = await fetchWithTimeout(`${baseUrl}${probe.path}`, {
						method: needsBody ? 'GET' : 'HEAD', redirect: 'follow',
						headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WAF-Checker/1.0)' },
					}, 3000);
					const exists = probeResp.status >= 200 && probeResp.status < 400;
					let snippet: string | undefined;
					if (exists && needsBody) {
						const text = await probeResp.text();
						snippet = text.substring(0, 500);
					}
					return { path: probe.path, name: probe.name, status: probeResp.status, exists, contentType: probeResp.headers.get('content-type') || undefined, snippet };
				} catch {
					return { path: probe.path, name: probe.name, status: 0, exists: false };
				}
			})),
			// Phase 5: SSL certificate info via crt.sh (latest cert)
			(async () => {
				try {
					const resp = await fetchWithTimeout(
						`https://crt.sh/?q=${encodeURIComponent(hostname)}&output=json`,
						{ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
						8000,
					);
					if (!resp.ok) return null;
					const text = await resp.text();
					if (!text || text.startsWith('<') || text.startsWith('<!')) return null; // HTML error page
					const certs: any[] = JSON.parse(text);
					if (!Array.isArray(certs) || certs.length === 0) return null;
					// Prefer non-precert, non-expired entries; fallback to any
					const now = Date.now();
					const validCerts = certs.filter((c: any) => {
						if (!c.not_after) return false;
						return new Date(c.not_after).getTime() > now;
					});
					const pool = validCerts.length > 0 ? validCerts : certs;
					const nonPrecerts = pool.filter((c: any) => c.name_value && !String(c.entry_type || '').includes('precert'));
					const sorted = (nonPrecerts.length > 0 ? nonPrecerts : pool)
						.sort((a: any, b: any) => new Date(b.not_before || 0).getTime() - new Date(a.not_before || 0).getTime());
					const cert = sorted[0];
					if (!cert) return null;
					return {
						issuer: cert.issuer_name || null,
						subject: cert.common_name || cert.name_value?.split('\n')[0] || null,
						notBefore: cert.not_before || null,
						notAfter: cert.not_after || null,
						serialNumber: cert.serial_number || null,
						domains: [...new Set(
							(cert.name_value || '').split('\n').map((d: string) => d.trim().toLowerCase()).filter((d: string) => d && d !== hostname.toLowerCase())
						)].slice(0, 20),
					};
				} catch { return null; }
			})(),
			// Phase 6: Reverse IP lookup (other domains on same IP)
			(async () => {
				const aRecords = await resolveDNS(hostname, 'A');
				if (aRecords.length === 0) return [];
				return reverseIPLookup(aRecords[0].data);
			})(),
			// Phase 7: Domain WHOIS via RDAP — direct registry servers (no third-party redirect)
			(async () => {
				try {
					const tld = reconRootDomain.split('.').pop()?.toLowerCase() || '';
					// Direct RDAP servers per TLD (official registry endpoints)
					const rdapServers: Record<string, string> = {
						'com': 'https://rdap.verisign.com/com/v1/domain/',
						'net': 'https://rdap.verisign.com/net/v1/domain/',
						'org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
						'fr': 'https://rdap.nic.fr/domain/',
						'de': 'https://rdap.denic.de/domain/',
						'uk': 'https://rdap.nominet.uk/uk/domain/',
						'co.uk': 'https://rdap.nominet.uk/uk/domain/',
						'io': 'https://rdap.nic.io/domain/',
						'dev': 'https://rdap.nic.google/domain/',
						'app': 'https://rdap.nic.google/domain/',
						'page': 'https://rdap.nic.google/domain/',
						'new': 'https://rdap.nic.google/domain/',
						'eu': 'https://rdap.eu/domain/',
						'nl': 'https://rdap.sidn.nl/domain/',
						'be': 'https://rdap.dns.be/domain/',
						'ch': 'https://rdap.nic.ch/domain/',
						'li': 'https://rdap.nic.ch/domain/',
						'at': 'https://rdap.nic.at/domain/',
						'info': 'https://rdap.afilias.net/rdap/info/domain/',
						'me': 'https://rdap.nic.me/domain/',
						'cc': 'https://rdap.verisign.com/cc/v1/domain/',
						'tv': 'https://rdap.verisign.com/tv/v1/domain/',
						'name': 'https://rdap.verisign.com/name/v1/domain/',
						'xyz': 'https://rdap.nic.xyz/domain/',
						'online': 'https://rdap.nic.online/domain/',
						'site': 'https://rdap.nic.site/domain/',
						'tech': 'https://rdap.nic.tech/domain/',
						'store': 'https://rdap.nic.store/domain/',
						'cloud': 'https://rdap.nic.cloud/domain/',
						'top': 'https://rdap.nic.top/domain/',
						'ru': 'https://rdap.tcinet.ru/domain/',
						'su': 'https://rdap.tcinet.ru/domain/',
						'br': 'https://rdap.registro.br/domain/',
						'au': 'https://rdap.auda.org.au/domain/',
						'ca': 'https://rdap.ca.fury.ca/rdap/domain/',
						'jp': 'https://rdap.jprs.jp/domain/',
						'cn': 'https://rdap.cnnic.cn/rdap/domain/',
						'in': 'https://rdap.registry.in/domain/',
						'pl': 'https://rdap.dns.pl/domain/',
						'se': 'https://rdap.iis.se/domain/',
						'no': 'https://rdap.norid.no/domain/',
						'fi': 'https://rdap.fi/domain/',
						'dk': 'https://rdap.dk-hostmaster.dk/domain/',
						'cz': 'https://rdap.nic.cz/domain/',
						'it': 'https://rdap.nic.it/domain/',
						'es': 'https://rdap.nic.es/domain/',
						'pt': 'https://rdap.dns.pt/domain/',
						'nu': 'https://rdap.iis.se/domain/',
						'nz': 'https://rdap.nzrs.net.nz/domain/',
						'co': 'https://rdap.nic.co/domain/',
					};

					let rdapResp: Response | null = null;

					// 1) Try direct RDAP server for this TLD
					const directUrl = rdapServers[tld];
					if (directUrl) {
						try {
							rdapResp = await fetchWithTimeout(`${directUrl}${encodeURIComponent(reconRootDomain)}`, {
								headers: { 'Accept': 'application/rdap+json, application/json' },
							}, 8000);
							if (!rdapResp.ok) rdapResp = null;
						} catch { rdapResp = null; }
					}

					// 2) Fallback: IANA RDAP bootstrap for unknown TLDs
					if (!rdapResp) {
						try {
							const bootstrapResp = await fetchWithTimeout('https://data.iana.org/rdap/dns.json', {}, 5000);
							if (bootstrapResp.ok) {
								const bootstrap: any = await bootstrapResp.json();
								for (const entry of (bootstrap.services || [])) {
									const tlds: string[] = entry[0] || [];
									const urls: string[] = entry[1] || [];
									if (tlds.includes(tld) && urls.length > 0) {
										const baseUrl = urls[0].endsWith('/') ? urls[0] : urls[0] + '/';
										rdapResp = await fetchWithTimeout(`${baseUrl}domain/${encodeURIComponent(reconRootDomain)}`, {
											headers: { 'Accept': 'application/rdap+json, application/json' },
										}, 8000);
										if (!rdapResp.ok) rdapResp = null;
										break;
									}
								}
							}
						} catch { /* ignore bootstrap failure */ }
					}

					if (!rdapResp || !rdapResp.ok) return null;
					const rdap: any = await rdapResp.json();

					const cleanUri = (val: string | null): string | null => {
						if (!val) return null;
						return val.replace(/^(tel:|mailto:|sip:)/i, '').trim() || null;
					};
					const extractContact = (entity: any) => {
						const contact: Record<string, string | null> = { name: null, org: null, email: null, phone: null, address: null, country: null };
						if (!entity?.vcardArray?.[1]) return contact;
						for (const field of entity.vcardArray[1]) {
							const key = field[0];
							const val = field[3];
							if (key === 'fn') contact.name = (typeof val === 'string' ? val.trim() : null) || null;
							else if (key === 'org') {
								const orgVal = Array.isArray(val) ? val[0] : val;
								contact.org = (typeof orgVal === 'string' ? orgVal.trim() : null) || null;
							}
							else if (key === 'email') contact.email = cleanUri(typeof val === 'string' ? val : null);
							else if (key === 'tel') contact.phone = cleanUri(typeof val === 'string' ? val : (typeof val === 'object' && val?.uri ? val.uri : null));
							else if (key === 'adr') {
								const parts = Array.isArray(val) ? val : [];
								const addrParts = parts.filter((p: any) => p && typeof p === 'string' && p.trim());
								if (addrParts.length > 0) contact.address = addrParts.join(', ');
								if (parts.length >= 7 && parts[6] && typeof parts[6] === 'string') contact.country = parts[6].trim();
							}
						}
						if (!contact.name && entity.handle) contact.name = entity.handle;
						return contact;
					};

					let registrar: string | null = null;
					let registrant: Record<string, string | null> | null = null;
					let adminContact: Record<string, string | null> | null = null;
					let techContact: Record<string, string | null> | null = null;
					let abuseContact: Record<string, string | null> | null = null;

					const processEntities = (entities: any[]) => {
						for (const entity of entities) {
							const roles: string[] = entity.roles || [];
							if (roles.includes('registrar')) {
								registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3]
									|| entity.publicIds?.[0]?.identifier || entity.handle || null;
								if (entity.entities) {
									for (const sub of entity.entities) {
										if (sub.roles?.includes('abuse')) abuseContact = extractContact(sub);
									}
								}
							}
							if (roles.includes('registrant')) registrant = extractContact(entity);
							if (roles.includes('administrative')) adminContact = extractContact(entity);
							if (roles.includes('technical')) techContact = extractContact(entity);
							if (roles.includes('abuse') && !abuseContact) abuseContact = extractContact(entity);
						}
					};
					if (rdap.entities) processEntities(rdap.entities);

					let creationDate: string | null = null;
					let expirationDate: string | null = null;
					let lastChanged: string | null = null;
					if (rdap.events) {
						for (const ev of rdap.events) {
							if (ev.eventAction === 'registration') creationDate = ev.eventDate || null;
							else if (ev.eventAction === 'expiration') expirationDate = ev.eventDate || null;
							else if (ev.eventAction === 'last changed' || ev.eventAction === 'last update of RDAP database') lastChanged = ev.eventDate || null;
						}
					}
					const status: string[] = rdap.status || [];
					const rdapNameservers: string[] = (rdap.nameservers || []).map((ns: any) => String(ns.ldhName || '').toLowerCase()).filter((n: string) => n);
					const domainName = rdap.ldhName || rdap.handle || reconRootDomain;
					const dnssec = rdap.secureDNS?.delegationSigned === true;
					const isEmptyContact = (c: Record<string, string | null> | null) => !c || Object.values(c).every(v => !v);
					return {
						domainName, registrar,
						registrant: isEmptyContact(registrant) ? null : registrant,
						adminContact: isEmptyContact(adminContact) ? null : adminContact,
						techContact: isEmptyContact(techContact) ? null : techContact,
						abuseContact: isEmptyContact(abuseContact) ? null : abuseContact,
						creationDate, expirationDate, lastChanged, status, dnssec,
						rdapNameservers: rdapNameservers.length > 0 ? rdapNameservers : null,
					};
				} catch { return null; }
			})(),
			// Phase 8: Certificate Transparency subdomain discovery
			discoverSubdomainsCT(reconRootDomain),
			// Phase 9: DNS brute-force subdomain discovery
			discoverSubdomainsBrute(reconRootDomain),
			// Phase 10: DMARC record
			(async () => {
				try {
					const dmarcRecs = await resolveDNS(`_dmarc.${hostname}`, 'TXT');
					return dmarcRecs.length > 0 ? String(dmarcRecs[0].data).replace(/^"|"$/g, '') : null;
				} catch { return null; }
			})(),
		]);

		// === Collect page results & run sync analysis ===
		if (pageResult.status === 'fulfilled') {
			const pg = pageResult.value;
			mainResponseTime = pg.responseTime;
			mainHtml = pg.html;
			mainHeaders = pg.headers;
			mainStatus = pg.status;
			Object.assign(responseHeaders, pg.rawHeaders);
		}

		if (mainHtml || mainStatus) {
			for (const tech of TECH_PATTERNS) {
				try {
					const evidence = tech.detect(mainHeaders, mainHtml, targetUrl);
					if (evidence) technologies.push({ name: tech.name, category: tech.category, evidence });
				} catch {}
			}

			const titleMatch = mainHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
			const descMatch = mainHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
				|| mainHtml.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
			const generatorMatch = mainHtml.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["']/i)
				|| mainHtml.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']generator["']/i);

			let generatorClean: string | null = null;
			let generatorFull: string | null = null;
			if (generatorMatch) {
				generatorFull = generatorMatch[1].trim();
				const cleanMatch = generatorFull.match(/^([\w.\-/]+(?:\s+[\d.]+)?)/);
				generatorClean = cleanMatch ? cleanMatch[1] : generatorFull;
			}

			pageInfo = {
				title: titleMatch ? titleMatch[1].trim() : null,
				description: descMatch ? descMatch[1].trim() : null,
				generator: generatorClean, generatorFull,
				statusCode: mainStatus,
				contentType: mainHeaders.get('content-type') || '',
				contentLength: mainHeaders.get('content-length') || String(mainHtml.length),
			};

			cmsDetails = extractCMSDetails(mainHtml, mainHeaders);
			jsLibraries = extractJSLibraries(mainHtml);
			openGraph = extractOpenGraph(mainHtml);
			pageMeta = extractPageMeta(mainHtml);

			if (generatorClean) {
				const existing = technologies.find(t => generatorClean!.toLowerCase().includes(t.name.toLowerCase()));
				if (!existing) technologies.push({ name: generatorClean, category: 'Generator', evidence: `<meta name="generator">` });
			}
		}

		// === Collect DNS results ===
		if (dnsResult.status === 'fulfilled') {
			dnsRecords = dnsResult.value;
			ipAddresses = (dnsRecords['A'] || []).map((r: any) => r.data);
			ipv6Addresses = (dnsRecords['AAAA'] || []).map((r: any) => r.data);
			nameservers = (dnsRecords['NS'] || []).map((r: any) => String(r.data).replace(/\.$/, ''));
			infrastructure = detectInfraFromRecords(dnsRecords);

			// Cross-reference: remove Cloudflare from technologies if DNS doesn't confirm it
			const dnsConfirmsCF = nameservers.some(ns => /cloudflare/i.test(ns))
				|| (dnsRecords['CNAME'] || []).some((r: any) => /cloudflare/i.test(String(r.data || '')));
			if (!dnsConfirmsCF) {
				const cfIdx = technologies.findIndex(t => t.name === 'Cloudflare' && t.category === 'CDN/WAF');
				if (cfIdx !== -1) {
					// Only keep Cloudflare if it was detected via HTML (not just headers which may be Worker-injected)
					const ev = technologies[cfIdx].evidence || '';
					if (!ev.includes('HTML') && !ev.includes('challenge') && !ev.includes('script')) {
						technologies.splice(cfIdx, 1);
					}
				}
			}
		}

		// === Collect WHOIS + PTR ===
		if (whoisPtrResult.status === 'fulfilled') {
			whoisData = whoisPtrResult.value.whois;
			reverseDns = whoisPtrResult.value.ptr;
		}

		// === Collect probe results ===
		if (probesResult.status === 'fulfilled') {
			for (const r of probesResult.value) {
				if (r.status === 'fulfilled') probeResults.push(r.value);
			}
		}

		// === Collect SSL certificate ===
		if (sslResult.status === 'fulfilled') sslCertificate = sslResult.value;

		// === Collect Reverse IP ===
		if (reverseIpResult.status === 'fulfilled') reverseIpDomains = reverseIpResult.value;

		// === Collect Domain RDAP ===
		const reconDomainWhois = domainRdapResult.status === 'fulfilled' ? domainRdapResult.value : null;

		// === Collect subdomains ===
		const ctSubdomains = ctSubsResult.status === 'fulfilled' ? ctSubsResult.value : [];
		const bruteSubdomains = bruteSubsResult.status === 'fulfilled' ? bruteSubsResult.value : [];
		const subdomainMap = new Map<string, string>();
		for (const brute of bruteSubdomains) {
			subdomainMap.set(brute.subdomain, brute.ip);
		}
		for (const ctSub of ctSubdomains) {
			if (!subdomainMap.has(ctSub)) subdomainMap.set(ctSub, '');
		}
		subdomains = Array.from(subdomainMap.entries())
			.map(([name, ip]) => ({ name, ip, source: bruteSubdomains.some(b => b.subdomain === name) ? (ctSubdomains.includes(name) ? 'DNS + CT' : 'DNS') : 'CT' }))
			.sort((a, b) => a.name.localeCompare(b.name));
		subdomainStats = { total: subdomains.length, fromCT: ctSubdomains.length, fromDNS: bruteSubdomains.length };

		// === Extract MX, TXT, Email Security from DNS records ===
		const mxRecords = dnsRecords['MX'] || [];
		mailServers = mxRecords.map((r: any) => {
			const parts = String(r.data).split(' ');
			return { priority: parseInt(parts[0]) || 0, server: (parts[1] || '').replace(/\.$/, '') };
		}).sort((a: any, b: any) => a.priority - b.priority);

		const txtRecords = dnsRecords['TXT'] || [];
		txtValues = txtRecords.map((r: any) => String(r.data).replace(/^"|"$/g, ''));

		const spfRecord = txtValues.find((t: string) => t.startsWith('v=spf1'));
		const dmarcRecord = dmarcResult.status === 'fulfilled' ? dmarcResult.value : null;
		emailSecurity = { spf: spfRecord || null, dmarc: dmarcRecord || null, hasSPF: !!spfRecord, hasDMARC: !!dmarcRecord };

		// === PHASE 6: Security headers (from phase 1 data) ===
		const securityHeadersList = ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy'];
		const securityHeaders: Record<string, string | null> = {};
		for (const h of securityHeadersList) securityHeaders[h] = mainHeaders.get(h);
		const securityScore = Object.values(securityHeaders).filter(v => v !== null).length;

		// === PHASE 7: SSL / TLS deep analysis ===
		const isHttps = parsedTarget.protocol === 'https:';
		const hstsHeader = mainHeaders.get('strict-transport-security');

		// Parse HSTS header into structured data
		let hstsParsed: any = null;
		if (hstsHeader) {
			const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/i);
			hstsParsed = {
				raw: hstsHeader,
				maxAge: maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null,
				includeSubDomains: /includesubdomains/i.test(hstsHeader),
				preload: /preload/i.test(hstsHeader),
			};
		}

		// HTTP → HTTPS redirect test (run in parallel, quick check)
		let httpRedirect: any = { tested: false, redirects: false, redirectUrl: null, statusCode: null };
		try {
			const httpUrl = `http://${hostname}/`;
			const rResp = await fetchWithTimeout(httpUrl, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WAF-Checker/1.0)' } }, 4000);
			httpRedirect.tested = true;
			httpRedirect.statusCode = rResp.status;
			const location = rResp.headers.get('location') || '';
			if (rResp.status >= 300 && rResp.status < 400 && location.startsWith('https://')) {
				httpRedirect.redirects = true;
				httpRedirect.redirectUrl = location;
			}
		} catch { httpRedirect.tested = true; }

		// Mixed content detection (scan HTML for http:// resources)
		const mixedContent: string[] = [];
		if (mainHtml && isHttps) {
			const httpPatterns = mainHtml.matchAll(/(?:src|href|action|poster|data)\s*=\s*["'](http:\/\/[^"']+)["']/gi);
			const seen = new Set<string>();
			for (const m of httpPatterns) {
				const url = m[1];
				if (!seen.has(url) && !url.includes('localhost') && !url.includes('127.0.0.1')) {
					seen.add(url);
					mixedContent.push(url);
				}
				if (mixedContent.length >= 20) break;
			}
		}

		// Extract additional info from response headers
		const serverHeader = mainHeaders.get('server') || null;
		const altSvc = mainHeaders.get('alt-svc') || null;

		// TLS / Protocol detection from headers + CDN knowledge
		const tlsInfo: { protocols: Array<{ name: string; supported: boolean | null; note: string }>; http2: boolean | null; http3: boolean | null; alpn: string | null } = {
			protocols: [],
			http2: null,
			http3: null,
			alpn: null,
		};

		// HTTP/3 detection via Alt-Svc header (h3 = HTTP/3 over QUIC = TLS 1.3)
		if (altSvc) {
			tlsInfo.alpn = altSvc;
			if (altSvc.includes('h3')) {
				tlsInfo.http3 = true;
			}
			if (altSvc.includes('h2')) {
				tlsInfo.http2 = true;
			}
		}

		// HTTP/2 detection from via header or other indicators
		const viaHeader = mainHeaders.get('via') || '';
		if (viaHeader.includes('2') || viaHeader.includes('HTTP/2')) {
			tlsInfo.http2 = true;
		}

		// Infer TLS support from CDN/infrastructure knowledge
		const infraProviders = infrastructure.map(i => i.provider.toLowerCase());
		const isCloudflare = infraProviders.includes('cloudflare') || nameservers.some(ns => /cloudflare/i.test(ns));
		const isAkamai = infraProviders.includes('akamai');
		const isAWS = infraProviders.includes('aws');
		const isFastly = infraProviders.includes('fastly');
		const isVercel = infraProviders.includes('vercel');
		const isNetlify = infraProviders.includes('netlify');
		const isMajorCDN = isCloudflare || isAkamai || isAWS || isFastly || isVercel || isNetlify;

		if (isHttps && mainStatus && mainStatus > 0) {
			// TLS 1.3
			if (tlsInfo.http3) {
				tlsInfo.protocols.push({ name: 'TLS 1.3', supported: true, note: 'Confirmed — HTTP/3 (h3) requires TLS 1.3' });
			} else if (isCloudflare || isFastly || isVercel || isNetlify) {
				tlsInfo.protocols.push({ name: 'TLS 1.3', supported: true, note: `Enabled by default on ${isCloudflare ? 'Cloudflare' : isFastly ? 'Fastly' : isVercel ? 'Vercel' : 'Netlify'}` });
			} else if (isMajorCDN) {
				tlsInfo.protocols.push({ name: 'TLS 1.3', supported: null, note: 'Likely supported by CDN — verify in server config' });
			} else {
				tlsInfo.protocols.push({ name: 'TLS 1.3', supported: null, note: 'Check server config — recommended to enable' });
			}

			// TLS 1.2
			tlsInfo.protocols.push({ name: 'TLS 1.2', supported: true, note: 'HTTPS connection succeeded — TLS 1.2 minimum' });

			// TLS 1.1 & 1.0
			if (isCloudflare) {
				tlsInfo.protocols.push({ name: 'TLS 1.1', supported: false, note: 'Disabled by Cloudflare (since June 2024)' });
				tlsInfo.protocols.push({ name: 'TLS 1.0', supported: false, note: 'Disabled by Cloudflare (since June 2024)' });
			} else if (isFastly || isVercel || isNetlify) {
				tlsInfo.protocols.push({ name: 'TLS 1.1', supported: false, note: `Disabled by default on ${isFastly ? 'Fastly' : isVercel ? 'Vercel' : 'Netlify'}` });
				tlsInfo.protocols.push({ name: 'TLS 1.0', supported: false, note: `Disabled by default on ${isFastly ? 'Fastly' : isVercel ? 'Vercel' : 'Netlify'}` });
			} else {
				tlsInfo.protocols.push({ name: 'TLS 1.1', supported: null, note: 'Deprecated — should be disabled' });
				tlsInfo.protocols.push({ name: 'TLS 1.0', supported: null, note: 'Deprecated — should be disabled' });
			}
		}

		// Extract certificate algorithm from issuer
		let certAlgorithm: string | null = null;
		if (sslCertificate?.issuer) {
			const issuerLc = sslCertificate.issuer.toLowerCase();
			if (issuerLc.includes('ecdsa') || issuerLc.includes('ec ') || issuerLc.includes('e1') || issuerLc.includes('e5') || issuerLc.includes('e6')) certAlgorithm = 'ECDSA';
			else if (issuerLc.includes('rsa') || issuerLc.includes('r3') || issuerLc.includes('r4') || issuerLc.includes('r10') || issuerLc.includes('r11')) certAlgorithm = 'RSA';
		}

		// Determine SSL/TLS security score
		let sslScore = 0;
		const sslChecks: Array<{ test: string; status: 'ok' | 'warning' | 'fail' | 'info'; detail: string }> = [];

		// Check HTTPS
		if (isHttps) { sslScore += 20; sslChecks.push({ test: 'HTTPS', status: 'ok', detail: 'Connection is encrypted via HTTPS' }); }
		else { sslChecks.push({ test: 'HTTPS', status: 'fail', detail: 'Site does not use HTTPS — all traffic is unencrypted' }); }

		// Check HTTP→HTTPS redirect
		if (httpRedirect.redirects) { sslScore += 15; sslChecks.push({ test: 'HTTP → HTTPS Redirect', status: 'ok', detail: `HTTP redirects to HTTPS (${httpRedirect.statusCode})` }); }
		else if (httpRedirect.tested && httpRedirect.statusCode) { sslChecks.push({ test: 'HTTP → HTTPS Redirect', status: 'fail', detail: `HTTP does not redirect to HTTPS (status ${httpRedirect.statusCode})` }); }
		else { sslChecks.push({ test: 'HTTP → HTTPS Redirect', status: 'warning', detail: 'Could not test HTTP redirect' }); }

		// Check HSTS
		if (hstsParsed) {
			if (hstsParsed.maxAge && hstsParsed.maxAge >= 31536000) {
				sslScore += 20;
				sslChecks.push({ test: 'HSTS', status: 'ok', detail: `Configured with max-age=${hstsParsed.maxAge} (≥ 1 year)` });
			} else if (hstsParsed.maxAge && hstsParsed.maxAge > 0) {
				sslScore += 10;
				sslChecks.push({ test: 'HSTS', status: 'warning', detail: `max-age=${hstsParsed.maxAge} — recommended: 31536000 (1 year) or more` });
			} else {
				sslChecks.push({ test: 'HSTS', status: 'warning', detail: 'HSTS header present but max-age is missing or 0' });
			}
			if (hstsParsed.includeSubDomains) { sslScore += 10; sslChecks.push({ test: 'HSTS includeSubDomains', status: 'ok', detail: 'All subdomains enforce HTTPS' }); }
			else { sslChecks.push({ test: 'HSTS includeSubDomains', status: 'warning', detail: 'Subdomains not included — consider adding includeSubDomains' }); }
			if (hstsParsed.preload) { sslScore += 10; sslChecks.push({ test: 'HSTS Preload', status: 'ok', detail: 'Eligible for browser HSTS preload list' }); }
			else { sslChecks.push({ test: 'HSTS Preload', status: 'info', detail: 'Not preloaded — consider adding preload directive' }); }
		} else {
			sslChecks.push({ test: 'HSTS', status: 'fail', detail: 'No Strict-Transport-Security header — browsers can be SSL-stripped' });
		}

		// Check certificate validity
		if (sslCertificate) {
			sslScore += 15;
			const notAfter = sslCertificate.notAfter ? new Date(sslCertificate.notAfter) : null;
			const daysLeft = notAfter ? Math.ceil((notAfter.getTime() - Date.now()) / 86400000) : null;
			if (daysLeft !== null && daysLeft > 30) {
				sslChecks.push({ test: 'Certificate Validity', status: 'ok', detail: `Valid for ${daysLeft} more days` });
			} else if (daysLeft !== null && daysLeft > 0) {
				sslChecks.push({ test: 'Certificate Validity', status: 'warning', detail: `Expires in ${daysLeft} days — renewal needed soon` });
			} else if (daysLeft !== null) {
				sslChecks.push({ test: 'Certificate Validity', status: 'fail', detail: 'Certificate has expired' });
			}
			if (certAlgorithm === 'ECDSA') { sslScore += 10; sslChecks.push({ test: 'Key Algorithm', status: 'ok', detail: 'ECDSA — modern and efficient' }); }
			else if (certAlgorithm === 'RSA') { sslChecks.push({ test: 'Key Algorithm', status: 'info', detail: 'RSA — widely compatible' }); }
		} else {
			sslChecks.push({ test: 'Certificate', status: 'warning', detail: 'Certificate details not available from CT logs' });
		}

		// Check mixed content
		if (mixedContent.length === 0 && isHttps) { sslScore += 10; sslChecks.push({ test: 'Mixed Content', status: 'ok', detail: 'No HTTP resources detected on HTTPS page' }); }
		else if (mixedContent.length > 0) { sslChecks.push({ test: 'Mixed Content', status: 'fail', detail: `${mixedContent.length} insecure HTTP resource(s) found on HTTPS page` }); }

		// TLS Protocol checks
		if (tlsInfo.http3) {
			sslChecks.push({ test: 'HTTP/3 (QUIC)', status: 'ok', detail: 'HTTP/3 supported — uses TLS 1.3 natively' });
		}
		if (tlsInfo.http2) {
			sslChecks.push({ test: 'HTTP/2', status: 'ok', detail: 'HTTP/2 supported (ALPN)' });
		} else if (tlsInfo.http2 === null && isHttps) {
			sslChecks.push({ test: 'HTTP/2', status: 'info', detail: 'Cannot determine HTTP/2 support from headers' });
		}

		// Cap score at 100
		sslScore = Math.min(sslScore, 100);

		// Determine SSL grade
		const sslGrade = sslScore >= 90 ? 'A+' : sslScore >= 80 ? 'A' : sslScore >= 70 ? 'B' : sslScore >= 50 ? 'C' : sslScore >= 30 ? 'D' : 'F';

		// === PHASE 8: Cookies ===
		const setCookieHeaders = responseHeaders['set-cookie'];
		if (setCookieHeaders) {
			for (const cookieStr of setCookieHeaders.split(/,(?=\s*\w+=)/)) {
				const parts = cookieStr.trim().split(';');
				const nameValue = parts[0]?.split('=');
				if (nameValue && nameValue[0]) {
					const flags: string[] = [];
					const cookieLower = cookieStr.toLowerCase();
					if (cookieLower.includes('secure')) flags.push('Secure');
					if (cookieLower.includes('httponly')) flags.push('HttpOnly');
					if (cookieLower.includes('samesite')) {
						const ssMatch = cookieLower.match(/samesite=(\w+)/);
						flags.push(`SameSite=${ssMatch ? ssMatch[1] : '?'}`);
					}
					cookies.push({ name: nameValue[0].trim(), flags });
				}
			}
		}

		return new Response(
			JSON.stringify({
				url: targetUrl,
				hostname,
				responseTime: mainResponseTime,
				pageInfo,
				cmsDetails,
				technologies,
				jsLibraries,
				openGraph,
				pageMeta,
				dns: { ipAddresses, ipv6Addresses, nameservers, records: dnsRecords },
				reverseDns,
				reverseIpDomains,
				infrastructure,
				domainWhois: reconDomainWhois,
				whois: whoisData,
				mailServers,
				txtRecords: txtValues,
				emailSecurity,
				subdomains,
				subdomainStats,
				probes: probeResults,
				securityHeaders,
				securityHeadersScore: `${securityScore}/${securityHeadersList.length}`,
				ssl: {
					isHttps,
					hsts: hstsHeader || null,
					hstsParsed,
					httpRedirect,
					mixedContent,
					tlsInfo,
					serverHeader,
					certAlgorithm,
					certificate: sslCertificate,
					score: sslScore,
					grade: sslGrade,
					checks: sslChecks,
				},
				cookies,
				responseHeaders,
				timestamp: new Date().toISOString(),
			}),
			{ headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: 'Full reconnaissance failed', message: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'content-type': 'application/json; charset=UTF-8' } },
		);
	}
}
