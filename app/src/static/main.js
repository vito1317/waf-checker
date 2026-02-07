function escapeHtml(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

// ===========================================
// URL NORMALIZATION
// ===========================================

/**
 * Normalize URL by adding https:// scheme if missing
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL with scheme
 */
function normalizeUrl(url) {
	if (!url || typeof url !== 'string') {
		return url;
	}
	
	const trimmedUrl = url.trim();
	if (!trimmedUrl) {
		return trimmedUrl;
	}
	
	// Check if URL already has a scheme (http://, https://, ftp://, etc.)
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedUrl)) {
		return trimmedUrl;
	}
	
	// Add https:// if no scheme is present
	return `https://${trimmedUrl}`;
}

// ===========================================
// CUSTOM ALERT & CONFIRM DIALOGS
// ===========================================

let confirmResolve = null;

function showAlert(message, title = 'Information', type = 'info') {
	const modal = document.getElementById('customAlertModal');
	const titleEl = document.getElementById('alertTitle');
	const messageEl = document.getElementById('alertMessage');
	const iconEl = document.getElementById('alertIcon');
	
	titleEl.textContent = title;
	messageEl.textContent = message;
	
	// Set icon based on type
	let iconSvg = '';
	let iconClass = '';
	switch (type) {
		case 'success':
			iconClass = 'bg-cyber-success/20';
			iconSvg = '<svg class="w-5 h-5 text-cyber-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
			break;
		case 'error':
			iconClass = 'bg-cyber-danger/20';
			iconSvg = '<svg class="w-5 h-5 text-cyber-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
			break;
		case 'warning':
			iconClass = 'bg-cyber-warning/20';
			iconSvg = '<svg class="w-5 h-5 text-cyber-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
			break;
		default:
			iconClass = 'bg-cyber-accent/20';
			iconSvg = '<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
	}
	
	iconEl.className = `w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`;
	iconEl.innerHTML = iconSvg;
	
	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';
}

function closeAlert() {
	const modal = document.getElementById('customAlertModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';
}

function showConfirm(message, title = 'Confirm', type = 'warning') {
	return new Promise((resolve) => {
		confirmResolve = resolve;
		
		const modal = document.getElementById('customConfirmModal');
		const titleEl = document.getElementById('confirmTitle');
		const messageEl = document.getElementById('confirmMessage');
		const iconEl = document.getElementById('confirmIcon');
		const okBtn = document.getElementById('confirmOkBtn');
		
		titleEl.textContent = title;
		messageEl.textContent = message;
		
		// Set icon and button based on type
		let iconSvg = '';
		let iconClass = '';
		let btnClass = '';
		switch (type) {
			case 'danger':
				iconClass = 'bg-cyber-danger/20';
				iconSvg = '<svg class="w-5 h-5 text-cyber-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';
				btnClass = 'bg-cyber-danger text-white';
				break;
			case 'warning':
				iconClass = 'bg-cyber-warning/20';
				iconSvg = '<svg class="w-5 h-5 text-cyber-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
				btnClass = 'bg-cyber-warning text-cyber-bg';
				break;
			default:
				iconClass = 'bg-cyber-accent/20';
				iconSvg = '<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
				btnClass = 'bg-cyber-accent text-cyber-bg';
		}
		
		iconEl.className = `w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`;
		iconEl.innerHTML = iconSvg;
		okBtn.className = `px-4 py-2 font-semibold rounded-lg hover:opacity-90 transition-all text-sm ${btnClass}`;
		
		modal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	});
}

function closeConfirm(result) {
	const modal = document.getElementById('customConfirmModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';
	
	if (confirmResolve) {
		confirmResolve(result);
		confirmResolve = null;
	}
}

// ===========================================
// HTTP STATUS CODES MODAL
// ===========================================

function generateHttpCodesTable(context = 'normal') {
	const codes = [
		{ code: '200', name: 'OK', normal: 'Request succeeded - <strong class="text-cyber-danger">VULNERABLE</strong> (attack passed)', falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Legitimate request allowed', httpManip: '<strong class="text-cyber-danger">BYPASS</strong> - Manipulation succeeded, WAF did not block', bg: 'bg-cyber-danger/5' },
		{ code: '201', name: 'Created', normal: 'Resource created - <strong class="text-cyber-danger">VULNERABLE</strong>', falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Resource created successfully', httpManip: 'Resource created - <strong class="text-cyber-danger">BYPASS</strong>', bg: 'bg-cyber-danger/5' },
		{ code: '204', name: 'No Content', normal: 'Success with no content - <strong class="text-cyber-danger">VULNERABLE</strong>', falsePositive: '<strong class="text-cyber-success">GOOD</strong> - Request processed successfully', httpManip: 'Success with no content - <strong class="text-cyber-danger">BYPASS</strong>', bg: 'bg-cyber-danger/5' },
		{ code: '301', name: 'Moved Permanently', normal: 'Permanent redirect - Check if WAF block page or normal redirect', falsePositive: 'Permanent redirect - Check if legitimate or WAF block', httpManip: 'Permanent redirect - Check if WAF block page or normal redirect', bg: 'bg-orange-500/5' },
		{ code: '302', name: 'Found', normal: 'Temporary redirect - Check Location header for block page', falsePositive: 'Temporary redirect - Investigate if unnecessary', httpManip: 'Temporary redirect - May indicate WAF redirecting to block page', bg: 'bg-orange-500/5' },
		{ code: '307', name: 'Temporary Redirect', normal: 'Temporary redirect (method preserved) - Investigate', falsePositive: 'Temporary redirect - May be normal or WAF-related', httpManip: 'Temporary redirect (method preserved) - Investigate', bg: 'bg-orange-500/5' },
		{ code: '308', name: 'Permanent Redirect', normal: 'Permanent redirect (method preserved) - Investigate', falsePositive: 'Permanent redirect - Investigate', httpManip: 'Permanent redirect (method preserved) - Investigate', bg: 'bg-orange-500/5' },
		{ code: '403', name: 'Forbidden', normal: '<strong class="text-cyber-success">PROTECTED</strong> - WAF blocked the attack', falsePositive: '<strong class="text-cyber-danger">FALSE POSITIVE</strong> - Legitimate request blocked', httpManip: '<strong class="text-cyber-success">PROTECTED</strong> - WAF detected and blocked the manipulation', bg: 'bg-cyber-success/5' },
		{ code: '404', name: 'Not Found', normal: 'Resource not found - May indicate WAF blocking or normal 404', falsePositive: 'Resource not found - May be normal or WAF blocking', httpManip: 'Resource not found - May indicate WAF blocking', bg: 'bg-orange-500/5' },
		{ code: '405', name: 'Method Not Allowed', normal: 'HTTP method not allowed - May indicate protection', falsePositive: 'HTTP method not allowed - May indicate over-protection', httpManip: 'HTTP method not allowed - May indicate protection', bg: 'bg-orange-500/5' },
		{ code: '406', name: 'Not Acceptable', normal: 'Server cannot produce acceptable response - Often WAF-related', falsePositive: 'Server cannot produce acceptable response - Often WAF-related', httpManip: 'Server cannot produce acceptable response - Often WAF-related', bg: 'bg-orange-500/5' },
		{ code: '429', name: 'Too Many Requests', normal: 'Rate limiting - WAF may be throttling requests', falsePositive: 'Rate limiting - May be too aggressive for legitimate traffic', httpManip: 'Rate limiting - WAF may be throttling manipulation attempts', bg: 'bg-orange-500/5' },
		{ code: '500', name: 'Internal Server Error', normal: 'Server error - May indicate WAF blocking or application error', falsePositive: 'Server error - May indicate WAF blocking or application issue', httpManip: 'Server error - May indicate WAF blocking or application error', bg: 'bg-orange-500/5' },
		{ code: '502', name: 'Bad Gateway', normal: 'Gateway error - Network or WAF infrastructure issue', falsePositive: 'Gateway error - Network or infrastructure issue', httpManip: 'Gateway error - Network or infrastructure issue', bg: 'bg-orange-500/5' },
		{ code: '503', name: 'Service Unavailable', normal: 'Service unavailable - May indicate WAF blocking or maintenance', falsePositive: 'Service unavailable - May indicate WAF blocking or maintenance', httpManip: 'Service unavailable - May indicate WAF blocking or maintenance', bg: 'bg-orange-500/5' },
		{ code: 'ERR', name: 'Error', normal: 'Network/connection error - Request failed to complete', falsePositive: 'Network/connection error - Request failed to complete', httpManip: 'Network/connection error - Request failed to complete', bg: 'bg-orange-500/5' },
	];

	const contextLabels = {
		normal: 'WAF Context',
		falsePositive: 'False Positive Context',
		httpManip: 'HTTP Manipulation Context'
	};

	let html = `<table class="w-full text-xs border-collapse">
		<thead>
			<tr class="bg-cyber-elevated/50">
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Code</th>
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Name</th>
				<th class="px-3 py-2 text-left border border-cyber-accent/20 text-gray-300 font-bold">Meaning (${contextLabels[context] || contextLabels.normal})</th>
			</tr>
		</thead>
		<tbody class="text-gray-400">`;

	codes.forEach((item) => {
		const meaning = item[context] || item.normal;
		const codeColor = item.code === '403' ? 'text-cyber-success' : 
		                 (item.code === '200' || item.code === '201' || item.code === '204') ? 'text-cyber-danger' : 
		                 'text-orange-400';
		
		html += `<tr class="${item.bg}">
			<td class="px-3 py-2 border border-cyber-accent/20 font-mono font-bold ${codeColor}">${item.code}</td>
			<td class="px-3 py-2 border border-cyber-accent/20">${item.name}</td>
			<td class="px-3 py-2 border border-cyber-accent/20">${meaning}</td>
		</tr>`;
	});

	html += `</tbody></table>`;
	return html;
}

function showHttpCodesModal(context = 'normal') {
	const modal = document.getElementById('httpCodesModal');
	const titleEl = document.getElementById('httpCodesTitle');
	const contentEl = document.getElementById('httpCodesTableContent');
	
	const contextTitles = {
		normal: 'HTTP Status Codes Reference - Security Test',
		falsePositive: 'HTTP Status Codes Reference - False Positive Test',
		httpManip: 'HTTP Status Codes Reference - HTTP Manipulation Test'
	};
	
	titleEl.textContent = contextTitles[context] || contextTitles.normal;
	contentEl.innerHTML = generateHttpCodesTable(context);
	
	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';
}

function closeHttpCodesModal() {
	const modal = document.getElementById('httpCodesModal');
	modal.style.display = 'none';
	document.body.style.overflow = '';
}

// Handle Escape key for modals
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		const alertModal = document.getElementById('customAlertModal');
		const confirmModal = document.getElementById('customConfirmModal');
		
		if (alertModal && alertModal.style.display === 'flex') {
			closeAlert();
		}
		if (confirmModal && confirmModal.style.display === 'flex') {
			closeConfirm(false);
		}
	}
});

// ===========================================

function getStatusClass(status, is_redirect, falsePositiveMode = false) {
	const codeNum = parseInt(status, 10);
	if (!isNaN(codeNum) && (is_redirect || codeNum === 405)) return 'status-redirect';

	if (falsePositiveMode) {
		// In false positive mode: 200 = good (green), 403 = bad (red)
		if (!isNaN(codeNum) && ((codeNum >= 200 && codeNum < 300) || (codeNum >= 500 && codeNum < 600))) return 'status-green';
		if (codeNum === 403) return 'status-red';
	} else {
		// Normal mode: 403 = good (green), 200 = bad (red)
		if (codeNum === 403) return 'status-green';
		if (!isNaN(codeNum) && ((codeNum >= 200 && codeNum < 300) || (codeNum >= 500 && codeNum < 600))) return 'status-red';
	}

	if (!isNaN(codeNum) && codeNum >= 400 && codeNum < 500) return 'status-orange';
	return 'status-gray';
}

function renderAnalyticsCards(results, falsePositiveMode = false) {
	if (!results || !results.length) return '';

	const totalTests = results.length;
	const bypassedTests = results.filter(r => {
		const s = parseInt(String(r.status), 10);
		return s === 200 || s === 500;
	}).length;
	const bypassRate = totalTests > 0 ? (bypassedTests / totalTests) * 100 : 0;
	const wafEffectiveness = Math.max(0, 100 - bypassRate);

	// Response time stats
	let totalTime = 0, slowCount = 0, minTime = Infinity, maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	const avgTime = Math.round(totalTime / totalTests);
	if (minTime === Infinity) minTime = 0;

	// Risk level
	let riskLevel;
	if (bypassRate > 75) riskLevel = 'Critical';
	else if (bypassRate > 50) riskLevel = 'High';
	else if (bypassRate > 25) riskLevel = 'Medium';
	else riskLevel = 'Low';

	const riskColors = {
		'Critical': 'bg-cyber-danger/15 border-cyber-danger/30 text-cyber-danger',
		'High': 'bg-cyber-warning/15 border-cyber-warning/30 text-cyber-warning',
		'Medium': 'bg-blue-500/15 border-blue-500/30 text-blue-400',
		'Low': 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success',
	};
	const riskStyle = riskColors[riskLevel] || riskColors['Low'];

	// Avg time color
	let avgColor = 'text-cyber-success';
	if (avgTime >= SLOW_RESPONSE_THRESHOLD) avgColor = 'text-red-400';
	else if (avgTime >= 1000) avgColor = 'text-orange-400';
	else if (avgTime >= 500) avgColor = 'text-yellow-400';

	return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
		<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 text-center">
			<div class="text-2xl font-bold text-white mb-1">${totalTests}</div>
			<div class="text-[10px] text-gray-400 uppercase tracking-wider">Total Tests</div>
		</div>
		<div class="bg-cyber-card border ${bypassedTests > 0 ? 'border-cyber-danger/30' : 'border-cyber-success/30'} rounded-xl p-4 text-center">
			<div class="text-2xl font-bold ${bypassedTests > 0 ? 'text-cyber-danger' : 'text-cyber-success'} mb-1">${bypassedTests}</div>
			<div class="text-[10px] text-gray-400 uppercase tracking-wider">Bypassed</div>
		</div>
		<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 text-center">
			<div class="text-2xl font-bold ${wafEffectiveness < 75 ? 'text-cyber-warning' : 'text-cyber-success'} mb-1">${Math.round(wafEffectiveness)}%</div>
			<div class="text-[10px] text-gray-400 uppercase tracking-wider">WAF Effectiveness</div>
		</div>
		<div class="bg-cyber-card border ${riskStyle} rounded-xl p-4 text-center">
			<div class="text-lg font-bold mb-1">${riskLevel}</div>
			<div class="text-[10px] text-gray-400 uppercase tracking-wider">Risk Level</div>
		</div>
		<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-2 text-center">
			<div class="text-base font-bold ${avgColor} font-mono">${avgTime}<span class="text-[10px] font-normal">ms</span></div>
			<div class="text-[9px] text-gray-400 uppercase tracking-wide">Avg Response</div>
		</div>
		<div class="bg-cyber-card border border-cyan-500/20 rounded-xl p-2 text-center">
			<div class="text-base font-bold text-cyan-400 font-mono">${minTime}<span class="text-[10px] font-normal">ms</span></div>
			<div class="text-[9px] text-gray-400 uppercase tracking-wide">Fastest</div>
		</div>
		<div class="bg-cyber-card border border-purple-500/20 rounded-xl p-2 text-center">
			<div class="text-base font-bold text-purple-400 font-mono">${maxTime}<span class="text-[10px] font-normal">ms</span></div>
			<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slowest</div>
		</div>
		<div class="bg-cyber-card border ${slowCount > 0 ? 'border-orange-500/30' : 'border-gray-500/20'} rounded-xl p-2 text-center">
			<div class="text-base font-bold ${slowCount > 0 ? 'text-orange-400' : 'text-gray-500'} font-mono">${slowCount}</div>
			<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slow (>${SLOW_RESPONSE_THRESHOLD/1000}s)</div>
		</div>
	</div>`;
}

function renderSummary(results, falsePositiveMode = false) {
	if (!results || !results.length) return '';
	const statusCounter = {};
	let totalResponseTime = 0;
	let slowRequestCount = 0;
	let minTime = Infinity;
	let maxTime = 0;

	for (const r of results) {
		statusCounter[r.status] = (statusCounter[r.status] || 0) + 1;
		const rt = r.responseTime || 0;
		totalResponseTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowRequestCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}

	const totalRequests = results.length;
	const avgTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;
	if (minTime === Infinity) minTime = 0;

	// Test analytics
	const bypassedTests = results.filter(r => { const s = parseInt(String(r.status), 10); return s === 200 || s === 500; }).length;
	const bypassRate = totalRequests > 0 ? (bypassedTests / totalRequests) * 100 : 0;
	const wafEffectiveness = Math.max(0, 100 - bypassRate);
	let riskLevel;
	if (bypassRate > 75) riskLevel = 'Critical';
	else if (bypassRate > 50) riskLevel = 'High';
	else if (bypassRate > 25) riskLevel = 'Medium';
	else riskLevel = 'Low';

	const riskColors = {
		'Critical': 'bg-cyber-danger/15 border-cyber-danger/30 text-cyber-danger',
		'High': 'bg-cyber-warning/15 border-cyber-warning/30 text-cyber-warning',
		'Medium': 'bg-blue-500/15 border-blue-500/30 text-blue-400',
		'Low': 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success',
	};
	const riskStyle = riskColors[riskLevel] || riskColors['Low'];

	// Avg time color
	let avgColor = 'text-cyber-success';
	let avgBg = 'bg-cyber-success/15 border-cyber-success/30';
	if (avgTime >= SLOW_RESPONSE_THRESHOLD) { avgColor = 'text-red-400'; avgBg = 'bg-red-500/15 border-red-500/30'; }
	else if (avgTime >= 1000) { avgColor = 'text-orange-400'; avgBg = 'bg-orange-500/15 border-orange-500/30'; }
	else if (avgTime >= 500) { avgColor = 'text-yellow-400'; avgBg = 'bg-yellow-500/15 border-yellow-500/30'; }

	let html = `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 mb-4">
		<div class="flex items-center justify-between mb-3">
			<h4 class="text-sm font-bold text-white uppercase tracking-wider">Results Summary</h4>
			<span class="text-xs text-gray-400">${totalRequests} total tests</span>
		</div>

		<!-- Test Results + Response Time Stats -->
		<div class="grid grid-cols-4 gap-2 mb-2">
			<div class="p-2.5 rounded-lg border ${riskStyle} text-center">
				<div class="text-lg font-bold mb-0.5">${riskLevel}</div>
				<div class="text-[10px] text-gray-400 uppercase tracking-wide">Risk Level</div>
			</div>
			<div class="p-2.5 rounded-lg border bg-cyber-accent/10 border-cyber-accent/20 text-center">
				<div class="text-lg font-bold ${wafEffectiveness < 75 ? 'text-cyber-warning' : 'text-cyber-success'} font-mono">${Math.round(wafEffectiveness)}%</div>
				<div class="text-[10px] text-gray-400 uppercase tracking-wide">WAF Effectiveness</div>
			</div>
			<div class="p-2.5 rounded-lg border bg-cyber-elevated/50 border-gray-600/30 text-center">
				<div class="text-lg font-bold text-white font-mono">${totalRequests}</div>
				<div class="text-[10px] text-gray-400 uppercase tracking-wide">Total Tests</div>
			</div>
			<div class="p-2.5 rounded-lg border ${bypassedTests > 0 ? 'bg-cyber-danger/15 border-cyber-danger/30' : 'bg-cyber-success/15 border-cyber-success/30'} text-center">
				<div class="text-lg font-bold ${bypassedTests > 0 ? 'text-cyber-danger' : 'text-cyber-success'} font-mono">${bypassedTests}</div>
				<div class="text-[10px] text-gray-400 uppercase tracking-wide">Bypassed</div>
			</div>
		</div>
		<div class="grid grid-cols-4 gap-2 mb-3">
			<div class="p-1.5 rounded-lg border ${avgBg} text-center">
				<div class="text-sm font-bold ${avgColor} font-mono">${avgTime}<span class="text-[9px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Avg Response</div>
			</div>
			<div class="p-1.5 rounded-lg border bg-cyan-500/10 border-cyan-500/20 text-center">
				<div class="text-sm font-bold text-cyan-400 font-mono">${minTime}<span class="text-[9px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Fastest</div>
			</div>
			<div class="p-1.5 rounded-lg border bg-purple-500/10 border-purple-500/20 text-center">
				<div class="text-sm font-bold text-purple-400 font-mono">${maxTime}<span class="text-[9px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slowest</div>
			</div>
			<div class="p-1.5 rounded-lg border ${slowRequestCount > 0 ? 'bg-orange-500/15 border-orange-500/30' : 'bg-gray-500/10 border-gray-500/20'} text-center">
				<div class="text-sm font-bold ${slowRequestCount > 0 ? 'text-orange-400' : 'text-gray-500'} font-mono">${slowRequestCount}</div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slow (>${SLOW_RESPONSE_THRESHOLD/1000}s)</div>
			</div>
		</div>

		<!-- Status Filter -->
		<h5 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Status Code</h5>
		<div class="flex flex-wrap gap-2 items-center">
			<label class="inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-elevated/50 rounded-lg cursor-pointer hover:bg-cyber-elevated transition-colors border border-cyber-accent/20">
				<input type="checkbox" id="statusSelectAll" checked class="w-3.5 h-3.5 accent-cyber-accent shrink-0" />
				<span class="text-xs font-semibold text-white">All</span>
				<span class="px-1.5 py-0.5 bg-cyber-accent/20 text-cyber-accent text-[10px] font-bold rounded">${totalRequests}</span>
			</label>`;
	
	const sortedCodes = Object.keys(statusCounter).sort();
	for (const code of sortedCodes) {
		const percent = totalRequests ? (statusCounter[code] / totalRequests) * 100 : 0;
		const codeNum = parseInt(code, 10);
		let colorClass = 'bg-gray-500';
		let textClass = 'text-gray-400';
		let dotColor = 'bg-gray-400';
		let pillBg = 'bg-gray-500/15 border-gray-500/30';
		
		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) { colorClass = 'bg-cyber-success'; textClass = 'text-cyber-success'; dotColor = 'bg-cyber-success'; pillBg = 'bg-cyber-success/10 border-cyber-success/30'; }
			else if (codeNum === 403) { colorClass = 'bg-cyber-danger'; textClass = 'text-cyber-danger'; dotColor = 'bg-cyber-danger'; pillBg = 'bg-cyber-danger/10 border-cyber-danger/30'; }
			else if (codeNum >= 300 && codeNum < 400) { colorClass = 'bg-orange-500'; textClass = 'text-orange-400'; dotColor = 'bg-orange-400'; pillBg = 'bg-orange-500/10 border-orange-500/30'; }
			else if (codeNum >= 400 && codeNum < 500) { colorClass = 'bg-cyber-warning'; textClass = 'text-cyber-warning'; dotColor = 'bg-cyber-warning'; pillBg = 'bg-cyber-warning/10 border-cyber-warning/30'; }
		} else {
			if (codeNum === 403) { colorClass = 'bg-cyber-success'; textClass = 'text-cyber-success'; dotColor = 'bg-cyber-success'; pillBg = 'bg-cyber-success/10 border-cyber-success/30'; }
			else if (codeNum >= 200 && codeNum < 300) { colorClass = 'bg-cyber-danger'; textClass = 'text-cyber-danger'; dotColor = 'bg-cyber-danger'; pillBg = 'bg-cyber-danger/10 border-cyber-danger/30'; }
			else if (codeNum >= 300 && codeNum < 400) { colorClass = 'bg-orange-500'; textClass = 'text-orange-400'; dotColor = 'bg-orange-400'; pillBg = 'bg-orange-500/10 border-orange-500/30'; }
			else if (codeNum >= 400 && codeNum < 500) { colorClass = 'bg-cyber-warning'; textClass = 'text-cyber-warning'; dotColor = 'bg-cyber-warning'; pillBg = 'bg-cyber-warning/10 border-cyber-warning/30'; }
		}
		
		html += `
			<label class="inline-flex items-center gap-2 px-3 py-1.5 ${pillBg} rounded-lg cursor-pointer hover:brightness-125 transition-all border">
				<input type="checkbox" class="status-filter-checkbox w-3.5 h-3.5 accent-cyber-accent shrink-0" data-status="${code}" checked />
				<span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
				<span class="text-xs font-bold ${textClass}">${code}</span>
				<span class="text-[10px] text-gray-500">${percent.toFixed(0)}%</span>
				<span class="px-1.5 py-0.5 ${colorClass}/20 ${textClass} text-[10px] font-bold rounded">${statusCounter[code]}</span>
			</label>`;
	}
	
	html += `</div></div>`;
	return html;
}

// Slow response threshold in ms
const SLOW_RESPONSE_THRESHOLD = 2000;

function renderResultRow(r, falsePositiveMode = false) {
	const statusStr = String(r.status);
	const isError = statusStr === 'ERR' || statusStr === 'error' || statusStr === 'Error';
	const codeNum = isError ? NaN : parseInt(statusStr, 10);
	let statusBg = 'bg-gray-500/20 text-gray-400';
	let payloadClass = '';
	let rowBgColor = '';
	let borderColor = '';
	
	if (isError || isNaN(codeNum)) {
		statusBg = 'bg-orange-500/20 text-orange-400';
		rowBgColor = 'rgba(249, 115, 22, 0.2)';
		borderColor = '#f97316';
	} else if (falsePositiveMode) {
		if (codeNum >= 200 && codeNum < 300) { 
			statusBg = 'bg-cyber-success/20 text-cyber-success'; 
			payloadClass = 'text-cyber-success';
			rowBgColor = 'rgba(34, 197, 94, 0.2)';
			borderColor = '#22c55e';
		}
		else if (codeNum === 403) { 
			statusBg = 'bg-cyber-danger/20 text-cyber-danger';
			rowBgColor = 'rgba(239, 68, 68, 0.2)';
			borderColor = '#ef4444';
		}
		else if (codeNum >= 300 && codeNum < 400) { 
			statusBg = 'bg-cyber-warning/20 text-cyber-warning';
			rowBgColor = 'rgba(249, 115, 22, 0.2)';
			borderColor = '#f97316';
		}
		else if (codeNum >= 400 && codeNum < 500 && codeNum !== 403) { 
			statusBg = 'bg-cyber-warning/20 text-cyber-warning';
			rowBgColor = 'rgba(249, 115, 22, 0.2)';
			borderColor = '#f97316';
		}
		else {
			rowBgColor = 'rgba(107, 114, 128, 0.1)';
			borderColor = '#6b7280';
		}
	} else {
		if (codeNum === 403) { 
			statusBg = 'bg-cyber-success/20 text-cyber-success'; 
			payloadClass = 'text-cyber-success';
			rowBgColor = 'rgba(34, 197, 94, 0.2)';
			borderColor = '#22c55e';
		}
		else if (codeNum >= 200 && codeNum < 300) { 
			statusBg = 'bg-cyber-danger/20 text-cyber-danger';
			rowBgColor = 'rgba(239, 68, 68, 0.2)';
			borderColor = '#ef4444';
		}
		else if (codeNum >= 300 && codeNum < 400) { 
			statusBg = 'bg-cyber-warning/20 text-cyber-warning';
			rowBgColor = 'rgba(249, 115, 22, 0.2)';
			borderColor = '#f97316';
		}
		else if (codeNum >= 400 && codeNum < 500 && codeNum !== 403) { 
			statusBg = 'bg-cyber-warning/20 text-cyber-warning';
			rowBgColor = 'rgba(249, 115, 22, 0.2)';
			borderColor = '#f97316';
		}
		else {
			rowBgColor = 'rgba(107, 114, 128, 0.1)';
			borderColor = '#6b7280';
		}
	}
	
	const responseTime = r.responseTime || 0;
	const isSlow = responseTime >= SLOW_RESPONSE_THRESHOLD;
	const rowStyle = `background-color: ${rowBgColor}; border-left: 4px solid ${borderColor};`;
	
	let statusTooltip = '';
	let statusDisplay = r.status;
	if (!isError && !isNaN(codeNum) && codeNum >= 300 && codeNum < 400) {
		statusTooltip = `title="Redirect (${codeNum}): The server redirected this request."`;
		statusDisplay = `${r.status}`;
	}

	// Response time display with slow indicator
	let timeHtml;
	if (isSlow) {
		timeHtml = `<span class="text-orange-400 font-semibold">${responseTime}ms</span> <span class="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded border border-orange-500/30" title="Response time exceeds ${SLOW_RESPONSE_THRESHOLD}ms">SLOW</span>`;
	} else {
		timeHtml = `${responseTime}ms`;
	}
	
	return `
		<tr data-status="${r.status}" style="${rowStyle}" class="hover:brightness-110 transition-all">
			<td class="px-4 py-2.5 text-gray-300">${escapeHtml(r.category)}</td>
			<td class="px-4 py-2.5 text-center">
				<span class="px-2 py-0.5 bg-cyber-accent/10 text-cyber-accent text-xs font-mono rounded">${r.method}</span>
			</td>
			<td class="px-4 py-2.5 text-center">
				<span class="px-2 py-0.5 ${statusBg} text-xs font-bold rounded cursor-pointer hover:brightness-125 transition-all" onclick="showHttpCodesModal()" ${statusTooltip}>${statusDisplay}</span>
			</td>
			<td class="px-4 py-2.5 text-center text-xs text-gray-500 whitespace-nowrap">${timeHtml}</td>
			<td class="px-4 py-2.5">
				<code class="text-xs font-mono ${payloadClass} bg-cyber-bg/50 px-2 py-1 rounded break-all">${escapeHtml(r.payload)}</code>
			</td>
		</tr>`;
}

/**
 * Renders the live results shell (header banner + empty table) used during streaming.
 * Rows are appended to #liveResultsBody as they arrive.
 */
function renderReportHeader(falsePositiveMode = false) {
	let html = '';

	if (falsePositiveMode) {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-blue-400">False Positive Test</h3>
					<p class="text-xs text-blue-300/70">Testing if legitimate traffic is being blocked by the WAF</p>
				</div>
			</div>
		</div>`;
	} else {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-cyber-accent/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-cyber-accent">Security Test In Progress...</h3>
					<p class="text-xs text-gray-400" id="liveTestCounter">0 tests completed</p>
				</div>
			</div>
		</div>`;
	}

	// Live results table
	html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
		<div id="liveResultsScroller" class="overflow-x-auto" style="max-height: 70vh; overflow-y: auto;">
			<table class="w-full text-sm" id="resultsTable">
				<thead class="sticky top-0 z-10">
					<tr class="bg-cyber-elevated/50 border-b border-cyber-accent/20">
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Payload</th>
					</tr>
				</thead>
				<tbody id="liveResultsBody" class="divide-y divide-cyber-accent/10">
				</tbody>
			</table>
		</div>
	</div>`;
	
	return html;
}

function renderReport(results, falsePositiveMode = false) {
	if (!results || results.length === 0) return '';
	
	let html = '';

	// Add visual indicator for test mode with explanation
	if (falsePositiveMode) {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-blue-400">False Positive Test</h3>
					<p class="text-xs text-blue-300/70">Testing if legitimate traffic is being blocked by the WAF</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs">
				<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-success/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-cyber-success"></span>
					<span class="text-cyber-success font-medium">200 = Allowed</span>
				</span>
				<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-danger/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-cyber-danger"></span>
					<span class="text-cyber-danger font-medium">403 = Blocked</span>
				</span>
				<span class="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-orange-500"></span>
					<span class="text-orange-400 font-medium">3xx = Redirect</span>
				</span>
				<button onclick="showHttpCodesModal('falsePositive')" class="px-3 py-1.5 bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent text-xs font-medium rounded-lg transition-all border border-cyber-accent/30 hover:border-cyber-accent">
					Show all HTTP codes
				</button>
			</div>
		</div>
		<div class="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
			<p class="text-xs text-gray-300 leading-relaxed">
				<strong class="text-blue-400">What is a False Positive Test?</strong> This test uses <strong class="text-white">legitimate, safe payloads</strong> to check if your WAF is blocking normal traffic. 
				If you see <strong class="text-cyber-danger">403 (red)</strong>, it means legitimate requests are being blocked - this is a <strong class="text-cyber-danger">false positive</strong> and should be investigated.
				<strong class="text-orange-400">Status 3xx (orange)</strong> means the server redirected the request. This could be a normal redirect or the WAF redirecting to a block page. Check the redirect location to determine if legitimate traffic is being redirected unnecessarily.
			</p>
		</div>`;
	} else {
		html += `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-cyber-accent/30 rounded-xl">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-cyber-accent">Security Test Complete</h3>
					<p class="text-xs text-gray-400">WAF protection analysis results</p>
				</div>
			</div>
			<div class="flex items-center gap-4 text-xs">
				<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-success/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-cyber-success"></span>
					<span class="text-cyber-success font-medium">403 = Protected</span>
				</span>
				<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-danger/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-cyber-danger"></span>
					<span class="text-cyber-danger font-medium">200 = Vulnerable</span>
				</span>
				<span class="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-lg">
					<span class="w-2 h-2 rounded-full bg-orange-500"></span>
					<span class="text-orange-400 font-medium">3xx = Redirect</span>
				</span>
				<button onclick="showHttpCodesModal('normal')" class="px-3 py-1.5 bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent text-xs font-medium rounded-lg transition-all border border-cyber-accent/30 hover:border-cyber-accent">
					Show all HTTP codes
				</button>
			</div>
		</div>
		<div class="mb-4 p-3 bg-cyber-accent/5 border border-cyber-accent/20 rounded-lg">
			<p class="text-xs text-gray-300 leading-relaxed">
				<strong class="text-cyber-accent">What are these tests?</strong> This test sends <strong class="text-white">malicious payloads</strong> (SQL Injection, XSS, etc.) to check if your WAF blocks them. 
				<strong class="text-cyber-success">Status 403 (green)</strong> means the WAF detected and blocked the attack. 
				<strong class="text-cyber-danger">Status 200 (red)</strong> means the attack succeeded - your application is <strong class="text-cyber-danger">vulnerable</strong> and the WAF did not protect it.
				<strong class="text-orange-400">Status 3xx (orange)</strong> means the server redirected the request. This could indicate the WAF is redirecting to a block page (good), or the server is redirecting normally (requires investigation). Check the redirect location to determine if it's a block page or a normal redirect.
			</p>
		</div>`;
	}

	// Add WAF detection info if available
	if (results.length > 0 && results[0].wafDetected) {
		html += `<div class="flex items-center gap-3 mb-4 p-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-lg">
			<svg class="w-5 h-5 text-cyber-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<span class="text-sm text-gray-300"><strong class="text-cyber-accent">WAF Detected:</strong> ${results[0].wafType}</span>
			<span class="text-xs text-gray-500">(Auto-detection)</span>
		</div>`;
	}

	html += renderSummary(results, falsePositiveMode);
	
	// Results table with modern design
	html += `<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm" id="resultsTable">
				<thead>
					<tr class="bg-cyber-elevated/50 border-b border-cyber-accent/20">
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Payload</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-cyber-accent/10">`;
	
	for (const r of results) {
		html += renderResultRow(r, falsePositiveMode);
	}
	
	html += `</tbody></table></div></div>`;
	
	setTimeout(() => {
		filterResultsTableByStatus();
		const all = document.querySelectorAll('.status-filter-checkbox');
		const checkedCount = Array.from(all).filter((cb) => cb.checked).length;
		const selectAll = document.getElementById('statusSelectAll');
		if (selectAll) {
			selectAll.checked = checkedCount === all.length;
		}
	}, 0);
	return html;
}

// --- PAYLOAD CATEGORIES LOGIC ---
// Categories are loaded dynamically from GitHub via the backend
let PAYLOAD_CATEGORIES = [];
let payloadCategoriesLoaded = false;
let payloadLoadRetries = 0;
const PAYLOAD_MAX_AUTO_RETRIES = 3;

async function loadPayloadCategories() {
	const container = document.getElementById('categoryCheckboxes');
	if (container) {
		container.innerHTML = `<div class="text-center py-3" id="payloadLoadingIndicator">
			<div class="spinner-border spinner-border-sm text-cyber-accent" role="status"></div>
			<span class="text-sm text-gray-400">Loading payloads from GitHub...</span>
		</div>`;
	}
	try {
		// Check loading status first
		const statusResp = await fetch('/api/payloads/status');
		const status = await statusResp.json();
		
		if (!status.loaded) {
			// Wait a bit and retry - backend is still loading from GitHub
			await new Promise(r => setTimeout(r, 2000));
		}
		
		const resp = await fetch('/api/payloads');
		if (!resp.ok) throw new Error(`Failed to load payloads (HTTP ${resp.status})`);
		const data = await resp.json();
		
		if (!data || Object.keys(data).length === 0) {
			throw new Error('Empty payload data received');
		}
		
		PAYLOAD_CATEGORIES = Object.keys(data);
		payloadCategoriesLoaded = true;
		payloadLoadRetries = 0;
		console.log(`Loaded ${PAYLOAD_CATEGORIES.length} payload categories from GitHub`);
		renderCategoryCheckboxes();
		
		// Update loading indicator with success
		const indicator = document.getElementById('payloadLoadingIndicator');
		if (indicator) indicator.remove();
	} catch (e) {
		console.error('Failed to load payload categories:', e);
		payloadLoadRetries++;
		
		if (payloadLoadRetries <= PAYLOAD_MAX_AUTO_RETRIES) {
			// Auto-retry with increasing delay
			const delay = payloadLoadRetries * 2000;
			if (container) {
				container.innerHTML = `<div class="text-center py-3" id="payloadLoadingIndicator">
					<div class="spinner-border spinner-border-sm text-cyber-warning" role="status"></div>
					<span class="text-sm text-cyber-warning">Retry ${payloadLoadRetries}/${PAYLOAD_MAX_AUTO_RETRIES}...</span>
				</div>`;
			}
			setTimeout(loadPayloadCategories, delay);
		} else {
			// Show error with retry button
			showPayloadLoadError(e.message);
		}
	}
}

function showPayloadLoadError(errorMsg) {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;
	container.innerHTML = `<div class="text-center py-4 px-3">
		<svg class="w-8 h-8 text-cyber-danger mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
		</svg>
		<p class="text-xs text-cyber-danger font-semibold mb-1">Failed to load payloads</p>
		<p class="text-[10px] text-gray-500 mb-3">${errorMsg || 'Connection to GitHub failed'}</p>
		<button type="button" onclick="retryLoadPayloads()" 
				class="px-4 py-2 bg-cyber-accent/20 border border-cyber-accent/40 rounded-lg text-xs font-bold text-cyber-accent hover:bg-cyber-accent/30 transition-all">
			<svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
			</svg>
			Retry
		</button>
	</div>`;
}

function retryLoadPayloads() {
	payloadLoadRetries = 0;
	loadPayloadCategories();
}

function renderCategoryCheckboxes() {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;
	// Remove loading indicator if present
	const indicator = document.getElementById('payloadLoadingIndicator');
	if (indicator) indicator.remove();
	
	if (PAYLOAD_CATEGORIES.length === 0) {
		container.innerHTML = '<div class="text-center py-3 text-gray-400">No categories loaded yet...</div>';
		return;
	}
	container.innerHTML = '';
	const defaultChecked = ['SQL Injection', 'XSS'];
	PAYLOAD_CATEGORIES.forEach((cat, idx) => {
		const id = 'cat_' + idx;
		const div = document.createElement('div');
		div.className = 'form-check';
		div.innerHTML = `<input class="form-check-input" type="checkbox" value="${cat}" id="${id}"${defaultChecked.includes(cat) ? ' checked' : ''}>
      <label class="form-check-label" for="${id}">${cat}</label>`;
		container.appendChild(div);
	});
}

function highlightCategoryCheckboxesByResults(results, falsePositiveMode = false) {
	// В режиме false positive: выделяем категории где есть 403 (плохо)
	// В обычном режиме: выделяем категории где есть 200 (плохо)
	const categoriesWithBadStatus = new Set();
	if (Array.isArray(results)) {
		results.forEach((r) => {
			if (falsePositiveMode) {
				if (r.status === 403 || r.status === '403') {
					categoriesWithBadStatus.add(r.category);
				}
			} else {
				if (r.status === 200 || r.status === '200') {
					categoriesWithBadStatus.add(r.category);
				}
			}
		});
	}
	// Пробегаем по чекбоксам и выделяем нужные label
	const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	categoryCheckboxes.forEach((cb) => {
		const label = cb.parentElement.querySelector('.form-check-label');
		if (!label) return;
		if (categoriesWithBadStatus.has(cb.value)) {
			label.classList.add('category-label-danger');
		} else {
			label.classList.remove('category-label-danger');
		}
	});
}

// --- Toggle payload template section within Advanced Settings ---
function updatePayloadTemplateSection() {
	const methodPOST = document.getElementById('methodPOST');
	const methodPUT = document.getElementById('methodPUT');
	const section = document.getElementById('payloadTemplateSection');
	if (!section) return;
	if ((methodPOST && methodPOST.checked) || (methodPUT && methodPUT.checked)) {
		section.style.display = '';
	} else {
		section.style.display = 'none';
	}
}

// --- Switch between Target and Advanced tabs ---
function switchConfigTab(tab) {
	const tabTarget = document.getElementById('tabTarget');
	const tabAdvanced = document.getElementById('tabAdvanced');
	const panelTarget = document.getElementById('panelTarget');
	const panelAdvanced = document.getElementById('panelAdvanced');
	
	if (!tabTarget || !tabAdvanced || !panelTarget || !panelAdvanced) return;
	
	if (tab === 'target') {
		// Activate Target tab
		tabTarget.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabTarget.classList.remove('border-transparent', 'text-gray-400');
		tabAdvanced.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabAdvanced.classList.add('border-transparent', 'text-gray-400');
		panelTarget.style.display = 'block';
		panelAdvanced.style.display = 'none';
	} else {
		// Activate Advanced tab
		tabAdvanced.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabAdvanced.classList.remove('border-transparent', 'text-gray-400');
		tabTarget.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabTarget.classList.add('border-transparent', 'text-gray-400');
		panelTarget.style.display = 'none';
		panelAdvanced.style.display = 'block';
	}
}

// Update description text - deprecated, kept for compatibility
function updateDescriptionText() {
	// No longer needed as description was removed from UI
}

// Progress bar helper functions
let progressInterval = null;
let progressAnimationValue = 0;

function showProgress() {
	const progressBar = document.getElementById('progressBar');
	if (progressBar) {
		progressBar.classList.remove('hidden');
	}
	// Reset slow warning
	const slowWarningEl = document.getElementById('progressSlowWarning');
	if (slowWarningEl) {
		slowWarningEl.textContent = '';
		slowWarningEl.classList.add('hidden');
	}
	// Start indeterminate animation
	startIndeterminateProgress();
}

function hideProgress() {
	const progressBar = document.getElementById('progressBar');
	if (progressBar) {
		progressBar.classList.add('hidden');
	}
	stopIndeterminateProgress();
}

function startIndeterminateProgress() {
	stopIndeterminateProgress();
	progressAnimationValue = 0;
	const progressFill = document.getElementById('progressFill');
	if (progressFill) {
		progressFill.style.transition = 'width 0.3s ease-out';
	}
}

function stopIndeterminateProgress() {
	if (progressInterval) {
		clearInterval(progressInterval);
		progressInterval = null;
	}
}

function updateProgress(current, total, category = '', text = 'Running tests...', batch = 0) {
	stopIndeterminateProgress();
	
	// Calculate percent, allow 100% when current >= total
	const percent = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
	
	const progressFill = document.getElementById('progressFill');
	const progressPercent = document.getElementById('progressPercent');
	const progressText = document.getElementById('progressText');
	const progressCategory = document.getElementById('progressCategory');
	const progressCount = document.getElementById('progressCount');
	
	if (progressFill) {
		progressFill.style.transition = 'width 0.5s ease-out';
		progressFill.style.width = `${percent}%`;
	}
	if (progressPercent) progressPercent.textContent = `${percent}%`;
	if (progressText) progressText.textContent = text;
	if (progressCategory) progressCategory.textContent = category || 'Processing...';
	if (progressCount) {
		const totalText = total > 0 ? ` / ${total}` : '';
		progressCount.textContent = `${current}${totalText} tests`;
	}
}

function finalizeProgress() {
	const progressFill = document.getElementById('progressFill');
	const progressPercent = document.getElementById('progressPercent');
	const progressText = document.getElementById('progressText');
	const progressCategory = document.getElementById('progressCategory');
	
	if (progressFill) {
		progressFill.style.transition = 'width 0.3s ease-out';
		progressFill.style.width = '100%';
	}
	if (progressPercent) progressPercent.textContent = '100%';
	if (progressText) progressText.textContent = 'Tests completed!';
	if (progressCategory) progressCategory.textContent = 'Complete';
}

async function fetchResults() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('checkBtn');
	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	
	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	// Show progress bar
	showProgress();
	updateProgress(0, 0, 'Initializing...', 'Preparing tests...');

	// Create test session
	const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	const startTime = new Date().toISOString();

	// Collect selected methods from method checkboxes
	const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
	const selectedMethods = Array.from(methodCheckboxes)
		.filter((cb) => cb.checked)
		.map((cb) => cb.value);
	
	// Ensure at least one method is selected
	if (selectedMethods.length === 0) {
		showAlert('Please select at least one HTTP method', 'No Method Selected', 'warning');
		btn.disabled = false;
		btn.textContent = oldText;
		return;
	}
	// Ensure payloads are loaded from GitHub
	if (!payloadCategoriesLoaded || PAYLOAD_CATEGORIES.length === 0) {
		showAlert('Payloads are still loading from GitHub. Please wait a moment and try again.', 'Payloads Loading', 'warning');
		btn.disabled = false;
		btn.textContent = oldText;
		return;
	}
	// Follow redirect
	const followRedirect = document.getElementById('followRedirect')?.checked ? true : false;
	// False positive test
	const falsePositiveTest = document.getElementById('falsePositiveTest')?.checked ? true : false;
	// Case sensitive test
	const caseSensitiveTest = document.getElementById('caseSensitiveTest')?.checked ? true : false;
	// Enhanced payloads
	const enhancedPayloads = document.getElementById('enhancedPayloads')?.checked ? true : false;
	// Use advanced WAF bypass payloads
	const useAdvancedPayloads = document.getElementById('useAdvancedPayloadsCheckbox')?.checked ? true : false;
	// Auto detect WAF
	const autoDetectWAF = document.getElementById('autoDetectWAF')?.checked ? true : false;
	// Use encoding variations
	const useEncodingVariations = document.getElementById('useEncodingVariations')?.checked ? true : false;
	// HTTP Manipulation
	const httpManipulation = document.getElementById('httpManipulation')?.checked ? true : false;
	// Collect selected categories
	const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	const selectedCategories = Array.from(categoryCheckboxes)
		.filter((cb) => cb.checked)
		.map((cb) => cb.value);
	// --- Сохраняем в localStorage ---
	localStorage.setItem('wafchecker_url', url);
	localStorage.setItem('wafchecker_methods', JSON.stringify(selectedMethods));
	localStorage.setItem('wafchecker_categories', JSON.stringify(selectedCategories));
	localStorage.setItem('wafchecker_followRedirect', followRedirect ? '1' : '0');
	localStorage.setItem('wafchecker_falsePositiveTest', falsePositiveTest ? '1' : '0');
	localStorage.setItem('wafchecker_caseSensitiveTest', caseSensitiveTest ? '1' : '0');
	localStorage.setItem('wafchecker_enhancedPayloads', enhancedPayloads ? '1' : '0');
	localStorage.setItem('wafchecker_useAdvancedPayloads', useAdvancedPayloads ? '1' : '0');
	localStorage.setItem('wafchecker_autoDetectWAF', autoDetectWAF ? '1' : '0');
	localStorage.setItem('wafchecker_useEncodingVariations', useEncodingVariations ? '1' : '0');
	localStorage.setItem('wafchecker_httpManipulation', httpManipulation ? '1' : '0');
	// --- Получаем шаблон и заголовки ---\n
	let payloadTemplate = '';
	const templateEl = document.getElementById('payloadTemplate');
	if (templateEl) {
		payloadTemplate = templateEl.value;
		localStorage.setItem('wafchecker_payloadTemplate', payloadTemplate);
	}

	let customHeaders = '';
	const headersEl = document.getElementById('customHeaders');
	if (headersEl) {
		customHeaders = headersEl.value;
		localStorage.setItem('wafchecker_customHeaders', customHeaders);
	}
	let allResults = [];
	let detectedWAFType = window.detectedWAF || null;
	let wafDetection = null;

	// Auto-detect WAF first if enabled
	if (autoDetectWAF && !detectedWAFType) {
		updateProgress(0, 0, 'Detecting WAF...', 'Auto-detecting WAF...');
		try {
			const wafResponse = await fetch(`/api/waf-detect?url=${encodeURIComponent(url)}`);
			if (wafResponse.ok) {
				const wafData = await wafResponse.json();
				if (wafData.detection && wafData.detection.detected) {
					detectedWAFType = wafData.detection.wafType;
					window.detectedWAF = detectedWAFType;
					wafDetection = wafData.detection;
					showWAFPanel(wafData);
				}
			}
		} catch (error) {
			console.warn('WAF detection failed, continuing with regular test:', error);
		}
	}

	// Get custom payloads from localStorage
	let customPayloadsData = {};
	try {
		const stored = localStorage.getItem('wafchecker_customPayloads');
		if (stored) {
			customPayloadsData = JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load custom payloads:', e);
	}

	// Use streaming API for real-time progress
	const totalCategories = selectedCategories.length;
	let estimatedTotalTests = totalCategories * selectedMethods.length * 5; // Initial estimate
	let completedTests = 0;
	let currentCategory = '';
	let slowCount = 0;
	
	updateProgress(0, estimatedTotalTests, `Starting ${totalCategories} categories...`, 'Initializing tests...', 0);

	// Prepare live results table in the DOM
	const resultsDiv = document.getElementById('results');
	resultsDiv.innerHTML = renderReportHeader(falsePositiveTest);
	resultsDiv.scrollIntoView({ behavior: 'smooth' });

	// Get the live tbody and scrollable container to append rows into
	const liveTbody = document.getElementById('liveResultsBody');
	const liveCounterEl = document.getElementById('liveTestCounter');
	const liveScroller = document.getElementById('liveResultsScroller');

	try {
		// Use streaming endpoint
		const params = new URLSearchParams({
			url,
			methods: selectedMethods.join(','),
			categories: selectedCategories.join(','),
			followRedirect: followRedirect ? '1' : '0',
			falsePositiveTest: falsePositiveTest ? '1' : '0',
			caseSensitiveTest: caseSensitiveTest ? '1' : '0',
			enhancedPayloads: enhancedPayloads ? '1' : '0',
			useAdvancedPayloads: useAdvancedPayloads ? '1' : '0',
			autoDetectWAF: autoDetectWAF ? '1' : '0',
			useEncodingVariations: useEncodingVariations ? '1' : '0',
			httpManipulation: httpManipulation ? '1' : '0',
			detectedWAF: detectedWAFType || '',
		});

		const response = await fetch(`/api/check-stream?${params.toString()}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payloadTemplate,
				customHeaders,
				detectedWAF: detectedWAFType,
				customPayloads: customPayloadsData,
			}),
		});

		if (!response.ok) {
			throw new Error(`Stream request failed: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let streamComplete = false;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || ''; // Keep incomplete line in buffer

			for (const line of lines) {
				if (!line.trim()) continue;
				if (line.startsWith('data: ')) {
					try {
						const data = JSON.parse(line.slice(6));
						
						if (data.type === 'total') {
							estimatedTotalTests = data.count;
							updateProgress(0, estimatedTotalTests, 'Starting tests...', 'Initializing...', 0);
						} else if (data.type === 'result') {
							allResults.push(data.result);
							completedTests = data.completed;
							
							// Track slow responses
							const rt = data.result.responseTime || 0;
							if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
							
							// Update current category from result
							if (data.result.category && data.result.category !== currentCategory) {
								currentCategory = data.result.category;
							}

							// Append row to live table
							if (liveTbody) {
								liveTbody.insertAdjacentHTML('beforeend', renderResultRow(data.result, falsePositiveTest));
								// Auto-scroll the table container to show latest result
								if (liveScroller) {
									liveScroller.scrollTop = liveScroller.scrollHeight;
								}
							}

							// Update live counter (clean, no slow warning here)
							if (liveCounterEl) {
								liveCounterEl.textContent = `${completedTests} / ${estimatedTotalTests} tests completed`;
							}

							// Update slow warning in progress bar
							const slowWarningEl = document.getElementById('progressSlowWarning');
							if (slowWarningEl) {
								if (slowCount > 0) {
									slowWarningEl.textContent = `${slowCount} slow response${slowCount > 1 ? 's' : ''} (>${SLOW_RESPONSE_THRESHOLD}ms)`;
									slowWarningEl.classList.remove('hidden');
								}
							}
							
							// Update progress bar
							updateProgress(
								completedTests,
								estimatedTotalTests,
								currentCategory || 'Processing...',
								`${completedTests} tests completed`,
								0
							);
						} else if (data.type === 'waf-detected') {
							if (data.waf && data.waf.detected) {
								detectedWAFType = data.waf.wafType;
								window.detectedWAF = detectedWAFType;
							}
						} else if (data.type === 'complete') {
							streamComplete = true;
							break;
						} else if (data.type === 'error') {
							throw new Error(data.message || 'Unknown error');
						}
					} catch (e) {
						console.error('Error parsing SSE data:', e, line);
					}
				}
			}
			
			if (streamComplete) break;
		}

		// Finalize progress
		updateProgress(completedTests, completedTests, 'Complete!', 'All tests completed!');

		// Keep slow warning visible in progress bar at completion
		const slowWarningEl = document.getElementById('progressSlowWarning');
		if (slowWarningEl && slowCount > 0) {
			slowWarningEl.textContent = `${slowCount} slow response${slowCount > 1 ? 's' : ''} (>${SLOW_RESPONSE_THRESHOLD}ms)`;
			slowWarningEl.classList.remove('hidden');
		}

		const endTime = new Date().toISOString();

		// Create test session object
		currentTestSession = {
			id: sessionId,
			url,
			startTime,
			endTime,
			totalTests: allResults.length,
			results: allResults,
			wafDetection,
			settings: {
				methods: selectedMethods,
				categories: selectedCategories,
				followRedirect,
				falsePositiveTest,
				caseSensitiveTest,
				enhancedPayloads,
				useAdvancedPayloads,
				autoDetectWAF,
				useEncodingVariations,
				httpManipulation,
			},
		};

		// Short delay to show 100% before hiding
		await new Promise(resolve => setTimeout(resolve, 500));
		hideProgress();

		// Now render the final full report (replaces live table with summary + filters + table)
		document.getElementById('results').innerHTML = renderReport(allResults, falsePositiveTest);
		highlightCategoryCheckboxesByResults(allResults, falsePositiveTest);

		// Show export controls
		showExportControls();
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
		hideProgress();
	}
}

function restoreStateFromLocalStorage() {
	// URL
	const url = localStorage.getItem('wafchecker_url');
	if (url) {
		const urlInput = document.getElementById('url');
		if (urlInput) urlInput.value = url;
	}
	// Methods
	const methods = localStorage.getItem('wafchecker_methods');
	if (methods) {
		try {
			const arr = JSON.parse(methods);
			const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
			methodCheckboxes.forEach((cb) => {
				cb.checked = arr.includes(cb.value);
			});
		} catch {}
	}
	// Follow redirect
	const followRedirect = localStorage.getItem('wafchecker_followRedirect');
	if (followRedirect !== null) {
		const el = document.getElementById('followRedirect');
		if (el) el.checked = !!parseInt(followRedirect, 10);
	}

	// False positive test
	const falsePositiveTest = localStorage.getItem('wafchecker_falsePositiveTest');
	if (falsePositiveTest !== null) {
		const el = document.getElementById('falsePositiveTest');
		if (el) {
			el.checked = !!parseInt(falsePositiveTest, 10);
		}
	}

	// Case sensitive test
	const caseSensitiveTest = localStorage.getItem('wafchecker_caseSensitiveTest');
	if (caseSensitiveTest !== null) {
		const el = document.getElementById('caseSensitiveTest');
		if (el) {
			el.checked = caseSensitiveTest === '1';
		}
	}

	// Enhanced payloads
	const enhancedPayloads = localStorage.getItem('wafchecker_enhancedPayloads');
	if (enhancedPayloads !== null) {
		const el = document.getElementById('enhancedPayloads');
		if (el) {
			el.checked = enhancedPayloads === '1';
		}
	}

	// Auto detect WAF
	const autoDetectWAF = localStorage.getItem('wafchecker_autoDetectWAF');
	if (autoDetectWAF !== null) {
		const el = document.getElementById('autoDetectWAF');
		if (el) {
			el.checked = autoDetectWAF === '1';
		}
	}

	// HTTP Manipulation
	const httpManipulation = localStorage.getItem('wafchecker_httpManipulation');
	if (httpManipulation !== null) {
		const el = document.getElementById('httpManipulation');
		if (el) {
			el.checked = httpManipulation === '1';
		}
	}

	// Categories
	const categories = localStorage.getItem('wafchecker_categories');
	if (categories) {
		try {
			const arr = JSON.parse(categories);
			const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
			categoryCheckboxes.forEach((cb) => {
				cb.checked = arr.includes(cb.value);
			});
		} catch {}
	}
	// Payload template
	const payloadTemplate = localStorage.getItem('wafchecker_payloadTemplate');
	if (payloadTemplate) {
		const templateEl = document.getElementById('payloadTemplate');
		if (templateEl) templateEl.value = payloadTemplate;
	}

	// Custom headers
	const customHeaders = localStorage.getItem('wafchecker_customHeaders');
	if (customHeaders) {
		const headersEl = document.getElementById('customHeaders');
		if (headersEl) headersEl.value = customHeaders;
	}

}


// WAF Detection functionality
async function detectWAF() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('detectWafBtn');
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	
	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Detecting...';

	try {
		const response = await fetch(`/api/waf-detect?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayWAFDetectionResults(data);
			showWAFPanel(data);
		} else {
			showAlert(`WAF Detection failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('WAF Detection error:', error);
		showAlert('WAF Detection failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

function displayWAFDetectionResults(data) {
	const resultsDiv = document.getElementById('results');
	const det = data.detection || {};
	const isBlocking = det.isActivelyBlocking === true;
	const isDefaultSecurity = det.hasDefaultSecurity === true;
	const infraName = det.infrastructure || null;
	
	let html = `<div class="bg-cyber-card border border-cyber-accent/30 rounded-xl overflow-hidden mb-4">
		<div class="flex items-center gap-3 p-4 border-b border-cyber-accent/20 bg-cyber-accent/10">
			<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
				<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-bold text-cyber-accent">WAF Detection Results</h3>
				<p class="text-xs text-gray-400">Three-phase detection: passive + active + evasion confirmation</p>
			</div>
		</div>
		
		<div class="p-4">
			<!-- Explanation Section -->
			<div class="mb-4 p-3 bg-cyber-accent/5 border border-cyber-accent/20 rounded-lg">
				<p class="text-xs text-gray-300 leading-relaxed mb-2">
					<strong class="text-cyber-accent">How does detection work?</strong> Three phases are used to avoid false positives:
				</p>
				<ul class="text-xs text-gray-400 space-y-1 ml-4 list-disc">
					<li><strong class="text-white">Phase 1 — Passive</strong>: A clean request identifies the CDN/infrastructure via response headers</li>
					<li><strong class="text-white">Phase 2 — Active</strong>: Obvious attack payloads (SQLi, XSS, LFI) are sent and responses compared against the baseline</li>
					<li><strong class="text-white">Phase 3 — Evasion</strong>: If probes are blocked, obfuscated payloads (comment injection, alternative syntax) are sent to distinguish default CDN security from active WAF rules</li>
				</ul>
				<p class="text-xs text-gray-400 mt-2 italic">
					A WAF is confirmed as "actively configured" only when evasion probes are also blocked, indicating custom rules beyond default CDN protection.
				</p>
			</div>`;

	// Baseline vs Probe status indicator
	if (det.baselineStatus !== undefined) {
		const baseStatus = det.baselineStatus;
		const prbStatus = det.probeStatus !== undefined ? det.probeStatus : baseStatus;
		const statusChanged = baseStatus !== prbStatus;
		
		html += `<div class="mb-4 p-3 bg-cyber-bg/50 border border-gray-600/30 rounded-lg">
			<p class="text-xs font-bold text-gray-300 mb-2">Request Comparison</p>
			<div class="flex items-center gap-3 flex-wrap">
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">Clean request:</span>
					<span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${baseStatus < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${baseStatus}</span>
				</div>
				<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">With payload:</span>
					<span class="px-2 py-0.5 rounded text-xs font-mono font-bold ${prbStatus < 400 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${prbStatus}</span>
				</div>
				${statusChanged 
					? '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">BLOCKED</span>' 
					: '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">NOT BLOCKED</span>'}
			</div>
		</div>`;
	}

	// Detection results — 4 possible states:
	// 1. isBlocking: WAF with active rules (evasion probes also blocked) → RED
	// 2. isDefaultSecurity: CDN default security only (evasion probes passed) → ORANGE
	// 3. detected but not blocking: CDN present, nothing blocked → CYAN
	// 4. not detected: no signatures found → GREEN
	if (det.detected) {
		if (isBlocking) {
			// Case 1: Active WAF rules confirmed — RED alert
			html += `<div class="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-red-400">WAF Actively Blocking: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — Active WAF rules confirmed (evasion probes also blocked)</p>
					</div>
				</div>`;
			
			if (infraName && infraName !== det.wafType) {
				html += `<p class="text-xs text-gray-400 mb-2">Infrastructure: <strong class="text-cyan-400">${escapeHtml(infraName)}</strong> (CDN), blocking WAF: <strong class="text-red-400">${escapeHtml(det.wafType)}</strong></p>`;
			}
		} else if (isDefaultSecurity) {
			// Case 2: CDN default security only — ORANGE/YELLOW alert
			html += `<div class="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-orange-400">CDN Default Security: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — <strong class="text-orange-400">No active WAF rules</strong></p>
					</div>
				</div>
				<p class="text-xs text-gray-400 mb-2">The target uses <strong class="text-orange-400">${escapeHtml(det.wafType)}</strong> as CDN/proxy. Obvious attack payloads are blocked by <strong>standard CDN protection</strong>, but evasion techniques pass through.</p>
				<p class="text-xs text-gray-400 italic">This indicates default security settings — no custom WAF rules are configured. This is normal behavior for most CDN providers.</p>`;
		} else {
			// Case 3: CDN/infra detected but NOT blocking at all — CYAN/info
			html += `<div class="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
				<div class="flex items-center gap-3 mb-2">
					<svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<div>
						<h4 class="text-sm font-bold text-cyan-400">CDN/Infrastructure Detected: ${escapeHtml(det.wafType)}</h4>
						<p class="text-xs text-gray-400">Confidence: <strong class="text-white">${det.confidence}%</strong> — <strong class="text-green-400">Probes were NOT blocked</strong></p>
					</div>
				</div>
				<p class="text-xs text-gray-400">The target uses <strong class="text-cyan-400">${escapeHtml(det.wafType)}</strong> as CDN/proxy, but neither basic nor advanced attack payloads are blocked.</p>`;
		}

		if (det.evidence && det.evidence.length > 0) {
			html += `<div class="mt-3">
				<p class="text-xs font-bold text-gray-300 mb-2">Evidence:</p>
				<ul class="space-y-1">`;
			det.evidence.forEach((evidence) => {
				const isInfra = evidence.includes('infrastructure') || evidence.includes('clean response') || evidence.includes('default') || evidence.includes('CDN');
				const isEvasion = evidence.includes('vasion') || evidence.includes('passed through');
				let codeClass = 'bg-cyber-bg/50 text-gray-300';
				if (isEvasion) codeClass = 'bg-orange-900/30 text-orange-300';
				else if (isInfra) codeClass = 'bg-cyan-900/30 text-cyan-300';
				html += `<li class="text-xs text-gray-400"><code class="${codeClass} px-2 py-0.5 rounded">${escapeHtml(evidence)}</code></li>`;
			});
			html += `</ul></div>`;
		}

		if (isBlocking && det.suggestedBypassTechniques && det.suggestedBypassTechniques.length > 0) {
			html += `<div class="mt-3">
				<p class="text-xs font-bold text-cyber-warning mb-2">Suggested Bypass Techniques:</p>
				<ul class="space-y-1">`;
			det.suggestedBypassTechniques.forEach((technique) => {
				html += `<li class="text-xs text-gray-400">&bull; ${escapeHtml(technique)}</li>`;
			});
			html += `</ul></div>`;
		}
		
		html += `</div>`;
	} else {
		// Case 4: Nothing detected
		html += `<div class="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
			<div class="flex items-center gap-3">
				<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<div>
					<p class="text-sm font-bold text-green-400">No WAF detected</p>
					<p class="text-xs text-gray-400">No WAF/CDN signatures found and probes were not blocked</p>
				</div>
			</div>
		</div>`;
	}

	// Bypass opportunities
	if (data.bypassOpportunities) {
		html += `<div class="mb-4">
			<p class="text-xs font-bold text-gray-300 mb-3">Bypass Opportunities:</p>
			<div class="grid grid-cols-2 gap-2">`;

		const opportunities = [
			{ key: 'httpMethodsBypass', label: 'HTTP Method Bypass', icon: '🔀' },
			{ key: 'headerBypass', label: 'Header Bypass', icon: '📋' },
			{ key: 'encodingBypass', label: 'Encoding Bypass', icon: '🔤' },
			{ key: 'parameterPollution', label: 'Parameter Pollution', icon: '🔁' },
		];

		opportunities.forEach((opp) => {
			const status = data.bypassOpportunities[opp.key];
			const bgClass = status ? 'bg-cyber-warning/20 border-cyber-warning/30' : 'bg-gray-500/10 border-gray-500/20';
			const textClass = status ? 'text-cyber-warning' : 'text-gray-500';
			const statusText = status ? 'Possible' : 'Not detected';

			html += `<div class="p-2 border rounded-lg ${bgClass}">
				<div class="flex items-center gap-2">
					<span class="text-xs">${opp.icon}</span>
					<span class="text-xs font-bold ${textClass}">${opp.label}</span>
				</div>
				<p class="text-xs text-gray-400 mt-1">${statusText}</p>
			</div>`;
		});

		html += `</div></div>`;
	}

	html += `</div></div>`;
	resultsDiv.innerHTML = html;
	// Hide export controls (not relevant for WAF detection)
	const exportControls = document.getElementById('exportControls');
	if (exportControls) exportControls.style.display = 'none';
}

function showWAFPanel(data) {
	const panel = document.getElementById('wafDetectionPanel');
	const resultsDiv = document.getElementById('wafDetectionResults');

	if (!panel || !resultsDiv) return;

	let html = '';
	const det = data.detection;

	if (det && det.detected) {
		if (det.isActivelyBlocking) {
			// Active WAF — red badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-danger ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-danger ms-1">WAF Active</span>
				</div>
			</div>`;
			window.detectedWAF = det.wafType;

			// Auto-enable advanced payloads if active WAF detected
			const advancedCheckbox = document.getElementById('useAdvancedPayloadsCheckbox');
			if (advancedCheckbox) {
				advancedCheckbox.checked = true;
			}
		} else if (det.hasDefaultSecurity) {
			// Default CDN security — orange badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-warning text-dark ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-warning text-dark ms-1">Default Security</span>
				</div>
			</div>`;
			window.detectedWAF = null; // Not a real WAF
		} else {
			// CDN detected, not blocking — info badge
			html = `<div class="d-flex align-items-center justify-content-between">
				<div>
					<strong>${det.wafType}</strong> detected
					<span class="badge bg-info ms-2">${det.confidence}% confidence</span>
					<span class="badge bg-info ms-1">CDN Only</span>
				</div>
			</div>`;
			window.detectedWAF = null;
		}
	} else {
		html = '<div>No WAF detected with high confidence</div>';
		window.detectedWAF = null;
	}

	resultsDiv.innerHTML = html;
	panel.style.display = 'block';
}

function hideWAFPanel() {
	const panel = document.getElementById('wafDetectionPanel');
	if (panel) {
		panel.style.display = 'none';
	}
}

function useAdvancedPayloads() {
	const checkbox = document.getElementById('useAdvancedPayloadsCheckbox');
	const encodingCheckbox = document.getElementById('useEncodingVariations');

	if (checkbox) checkbox.checked = true;
	if (encodingCheckbox) encodingCheckbox.checked = true;

	showAlert('Advanced payloads enabled! Run the test to see WAF-specific bypass techniques.', 'Success', 'success');
}

function clearWAFResults() {
	const resultsDiv = document.getElementById('results');
	const wafCards = resultsDiv.querySelectorAll('.card:has(.card-header h3:contains("WAF Detection"))');
	wafCards.forEach((card) => card.remove());

	hideWAFPanel();
	window.detectedWAF = null;
}

// HTTP Manipulation Testing
async function testHTTPManipulation() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('httpManipulationBtn');
	const urlInput = document.getElementById('url');
	const url = normalizeUrl(urlInput.value);
	
	// Update the input field with normalized URL if it was changed
	if (url !== urlInput.value) {
		urlInput.value = url;
	}

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';

	try {
		const response = await fetch(`/api/http-manipulation?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayHTTPManipulationResults(data);
		} else {
			showAlert(`HTTP Manipulation test failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('HTTP Manipulation test error:', error);
		showAlert('HTTP Manipulation test failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

function displayHTTPManipulationResults(data) {
	const resultsDiv = document.getElementById('results');
	
	let html = `<div class="flex items-center justify-between mb-4 p-4 bg-cyber-card border border-cyber-warning/30 rounded-xl">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-cyber-warning/20 flex items-center justify-center">
				<svg class="w-5 h-5 text-cyber-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-bold text-cyber-warning">HTTP Manipulation Test</h3>
				<p class="text-xs text-gray-400">Testing WAF bypass via protocol manipulation</p>
			</div>
		</div>
		<div class="flex items-center gap-4 text-xs">
			<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-success/20 rounded-lg">
				<span class="w-2 h-2 rounded-full bg-cyber-success"></span>
				<span class="text-cyber-success font-medium">403 = Protected</span>
			</span>
			<span class="flex items-center gap-2 px-3 py-1.5 bg-cyber-danger/20 rounded-lg">
				<span class="w-2 h-2 rounded-full bg-cyber-danger"></span>
				<span class="text-cyber-danger font-medium">200 = Bypass</span>
			</span>
			<button onclick="showHttpCodesModal('httpManip')" class="px-3 py-1.5 bg-cyber-accent/10 hover:bg-cyber-accent/20 text-cyber-accent text-xs font-medium rounded-lg transition-all border border-cyber-accent/30 hover:border-cyber-accent">
				Show all HTTP codes
			</button>
		</div>
	</div>
	<div class="mb-4 p-3 bg-cyber-warning/5 border border-cyber-warning/20 rounded-lg">
		<p class="text-xs text-gray-300 leading-relaxed">
			<strong class="text-cyber-warning">What is HTTP Manipulation?</strong> This test checks if your WAF can be <strong class="text-cyber-danger">bypassed</strong> by manipulating the HTTP protocol instead of using malicious payloads. 
			It tests techniques like <strong class="text-white">HTTP Verb Tampering</strong> (using non-standard methods like PATCH, TRACE), <strong class="text-white">Parameter Pollution</strong> (sending duplicate parameters), and <strong class="text-white">Content-Type Confusion</strong>. 
			<strong class="text-cyber-success">Status 403 (green)</strong> means the WAF blocked the manipulation. 
			<strong class="text-cyber-danger">Status 200 (red)</strong> means the request succeeded - the WAF can be <strong class="text-cyber-danger">bypassed</strong> with this technique.
		</p>
	</div>
	
	<div class="bg-cyber-card border border-cyber-warning/30 rounded-xl overflow-hidden mb-4">`;

	if (data.results && data.results.length > 0) {
		html += `<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-cyber-elevated/50 border-b border-cyber-accent/20">
						<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Technique</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Method</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
						<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase">Result</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-cyber-accent/10">`;

		data.results.forEach((result) => {
			const statusStr = String(result.status);
			const isError = statusStr === 'ERR' || statusStr === 'error' || statusStr === 'Error';
			const codeNum = isError ? NaN : parseInt(statusStr, 10);
			let statusBg = 'bg-gray-500/20 text-gray-400';
			let rowBgColor = '';
			let borderColor = '';
			
			// Handle errors first (orange)
			if (isError || isNaN(codeNum)) {
				statusBg = 'bg-orange-500/20 text-orange-400';
				rowBgColor = 'rgba(249, 115, 22, 0.2)'; // orange-500 with 20% opacity
				borderColor = '#f97316'; // orange-500
			} else if (codeNum >= 200 && codeNum < 300) {
				statusBg = 'bg-cyber-danger/20 text-cyber-danger';
				// For HTTP manipulation, 200 = bypass = red
				rowBgColor = 'rgba(239, 68, 68, 0.2)'; // red-500 with 20% opacity
				borderColor = '#ef4444'; // red-500
			}
			else if (codeNum === 403) {
				statusBg = 'bg-cyber-success/20 text-cyber-success';
				// 403 = blocked = green
				rowBgColor = 'rgba(34, 197, 94, 0.2)'; // green-500 with 20% opacity
				borderColor = '#22c55e'; // green-500
			}
			else if (codeNum >= 300 && codeNum < 400) {
				statusBg = 'bg-cyber-warning/20 text-cyber-warning';
				rowBgColor = 'rgba(249, 115, 22, 0.2)'; // orange-500 with 20% opacity
				borderColor = '#f97316'; // orange-500
			}
			else if (codeNum >= 400 && codeNum < 500 && codeNum !== 403) {
				statusBg = 'bg-cyber-warning/20 text-cyber-warning';
				rowBgColor = 'rgba(249, 115, 22, 0.2)'; // orange-500 with 20% opacity
				borderColor = '#f97316'; // orange-500
			}
			else {
				rowBgColor = 'rgba(107, 114, 128, 0.1)'; // gray-500 with 10% opacity
				borderColor = '#6b7280'; // gray-500
			}
			
			// Determine if bypass occurred based on status code
			// For HTTP manipulation: 200 = potential bypass, 403 = blocked, others = error/redirect
			let resultText = 'Blocked';
			let resultBg = 'bg-cyber-success/20 text-cyber-success';
			
			if (!isError && !isNaN(codeNum)) {
				if (codeNum >= 200 && codeNum < 300) {
					// Status 200 = request succeeded = potential bypass
					resultText = 'Potential Bypass';
					resultBg = 'bg-cyber-warning/20 text-cyber-warning';
					// Already set to red above
				} else if (codeNum === 403) {
					// Status 403 = WAF blocked = good
					resultText = 'Blocked';
					resultBg = 'bg-cyber-success/20 text-cyber-success';
					// Already set to green above
				} else if (codeNum >= 300 && codeNum < 400) {
					// Redirect
					resultText = 'Redirect';
					resultBg = 'bg-orange-500/20 text-orange-400';
				} else if (codeNum >= 400 && codeNum < 500) {
					// Other 4xx errors
					resultText = 'Error';
					resultBg = 'bg-orange-500/20 text-orange-400';
				} else {
					resultText = 'Unknown';
					resultBg = 'bg-gray-500/20 text-gray-400';
				}
			} else {
				// Error case
				resultText = 'Error';
				resultBg = 'bg-orange-500/20 text-orange-400';
			}

			const rowStyle = `background-color: ${rowBgColor}; border-left: 4px solid ${borderColor};`;
			const methodDisplay = result.method && result.method !== 'undefined' ? result.method : (result.technique || 'N/A');
			html += `<tr style="${rowStyle}" class="hover:brightness-110 transition-all">
				<td class="px-4 py-2.5 text-gray-300">${escapeHtml(result.testType || result.technique || 'Unknown')}</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2 py-0.5 bg-cyber-accent/10 text-cyber-accent text-xs font-mono rounded">${escapeHtml(methodDisplay)}</span>
				</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2 py-0.5 ${statusBg} text-xs font-bold rounded cursor-pointer hover:brightness-125 transition-all" onclick="showHttpCodesModal('httpManip')">${result.status}</span>
				</td>
				<td class="px-4 py-2.5 text-center">
					<span class="px-2 py-1 ${resultBg} text-xs font-bold rounded">${resultText}</span>
				</td>
			</tr>`;
		});

		html += '</tbody></table></div>';
	} else {
		html += `<div class="p-4 text-center text-gray-400 text-sm">No HTTP manipulation tests performed.</div>`;
	}

	html += '</div>';
	resultsDiv.innerHTML = html;
	// Hide export controls (not relevant for HTTP manipulation)
	const exportControls = document.getElementById('exportControls');
	if (exportControls) exportControls.style.display = 'none';
}

// HTTP Manipulation Testing functionality
async function testHTTPManipulation() {
	// Close mobile drawer if open
	closeMobileDrawer();

	const btn = document.getElementById('httpManipulationBtn');
	const url = normalizeUrl(document.getElementById('url').value);

	if (!url) {
		showAlert('Please enter a URL first', 'Missing URL', 'warning');
		return;
	}

	btn.disabled = true;
	const oldText = btn.textContent;
	btn.textContent = 'Testing...';

	try {
		const response = await fetch(`/api/http-manipulation?url=${encodeURIComponent(url)}`);
		const data = await response.json();

		if (response.ok) {
			displayHTTPManipulationResults(data);
		} else {
			showAlert(`HTTP Manipulation test failed: ${data.error || 'Unknown error'}`, 'Error', 'error');
		}
	} catch (error) {
		console.error('HTTP Manipulation test error:', error);
		showAlert('HTTP Manipulation test failed. Please check the console for details.', 'Error', 'error');
	} finally {
		btn.disabled = false;
		btn.textContent = oldText;
	}
}

// Toggle all categories - switches between all selected and none selected
function toggleAllCategories() {
	const checkboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
	const allChecked = Array.from(checkboxes).every(cb => cb.checked);
	const toggleBtn = document.getElementById('toggleAllCategoriesBtn');
	
	checkboxes.forEach((cb) => {
		cb.checked = !allChecked;
	});
	
	// Update button icon
	if (toggleBtn) {
		const svg = toggleBtn.querySelector('svg');
		if (svg) {
			if (allChecked) {
				// Show "select all" icon (list with checks)
				svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
			} else {
				// Show "deselect all" icon (X marks)
				svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>';
			}
		}
	}
}

// Initialize application
function initApp() {
	// Force dark theme
	document.body.setAttribute('data-theme', 'dark');
	// Load payload categories dynamically from GitHub (via backend)
	loadPayloadCategories();
	// --- Enter в поле URL ---
	const urlInput = document.getElementById('url');
	if (urlInput) {
		urlInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				fetchResults();
			}
		});
	}
	// --- Восстановить состояние ---
	restoreStateFromLocalStorage();

	// Update description based on false positive test state
	updateDescriptionText();
	// --- Toggle payload template section on method change ---
	const methodCheckboxes = document.querySelectorAll('.methods-grid input[type=checkbox]');
	methodCheckboxes.forEach((cb) => {
		cb.addEventListener('change', updatePayloadTemplateSection);
	});
	updatePayloadTemplateSection();
	
	// Делегированный обработчик на #results
	const resultsDiv = document.getElementById('results');
	if (resultsDiv) {
		resultsDiv.addEventListener('change', function (e) {
			const target = e.target;
			// Select all statuses
			if (target && target.id === 'statusSelectAll') {
				const checked = target.checked;
				document.querySelectorAll('.status-filter-checkbox').forEach((cb) => {
					cb.checked = checked;
				});
				filterResultsTableByStatus();
			}
			// Обычные чекбоксы статусов
			if (target && target.classList.contains('status-filter-checkbox')) {
				// Если хотя бы один снят — select all снимается, если все включены — включается
				const all = document.querySelectorAll('.status-filter-checkbox');
				const checkedCount = Array.from(all).filter((cb) => cb.checked).length;
				const selectAll = document.getElementById('statusSelectAll');
				if (selectAll) {
					selectAll.checked = checkedCount === all.length;
				}
				filterResultsTableByStatus();
			}
		});
	}
}

// =============================================
// Mobile Drawer (slide-in panel)
// =============================================
function toggleMobileDrawer() {
	const aside = document.querySelector('aside');
	const overlay = document.getElementById('drawerOverlay');
	const isOpen = aside.classList.contains('drawer-open');
	if (isOpen) {
		closeMobileDrawer();
	} else {
		aside.classList.add('drawer-open');
		overlay.classList.add('active');
		document.body.classList.add('drawer-is-open');
	}
}

function closeMobileDrawer() {
	const aside = document.querySelector('aside');
	const overlay = document.getElementById('drawerOverlay');
	aside.classList.remove('drawer-open');
	overlay.classList.remove('active');
	document.body.classList.remove('drawer-is-open');
}

// Payload config: go back from editor to categories list (mobile)
function configGoBack() {
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.remove('config-editing');
	// Update category list to reflect any changes
	renderConfigCategoryList();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Function to toggle help content
function toggleHelp(helpId) {
	const helpElement = document.getElementById(helpId);
	if (helpElement) {
		helpElement.style.display = helpElement.style.display === 'none' ? 'block' : 'none';
	}
}

function filterResultsTableByStatus() {
	const checkedStatuses = Array.from(document.querySelectorAll('.status-filter-checkbox:checked')).map((cb) =>
		cb.getAttribute('data-status'),
	);
	const rows = document.querySelectorAll('#resultsTable tr[data-status]');
	rows.forEach((row) => {
		if (checkedStatuses.includes(row.getAttribute('data-status'))) {
			row.style.display = '';
		} else {
			row.style.display = 'none';
		}
	});
}

// Global variables for test session and batch testing
let currentTestSession = null;
let currentBatchJob = null;
let batchPollInterval = null;

// Enhanced reporting and analytics functions
function showExportControls() {
	const exportControls = document.getElementById('exportControls');
	if (exportControls && currentTestSession) {
		exportControls.style.display = 'block';
	}
}

function hideExportControls() {
	const exportControls = document.getElementById('exportControls');
	if (exportControls) {
		exportControls.style.display = 'none';
	}
}

function exportResults(format) {
	if (!currentTestSession) {
		showAlert('No test results to export', 'Warning', 'warning');
		return;
	}

	try {
		switch (format) {
			case 'json':
				exportAsJSON(currentTestSession, true);
				break;
			case 'csv':
				exportAsCSV(currentTestSession.results);
				break;
			case 'pdf':
				exportAsHTMLReport(currentTestSession);
				break;
			default:
				showAlert('Unknown export format', 'Error', 'error');
		}
	} catch (error) {
		console.error('Export failed:', error);
		showAlert('Export failed. Please check the console for details.', 'Error', 'error');
	}
}

function exportAsJSON(session, includeAnalysis) {
	const exportData = {
		...session,
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
	};

	if (includeAnalysis) {
		const vulnerabilityScores = generateVulnerabilityScores(session.results, session.settings.falsePositiveTest);
		const executiveSummary = generateExecutiveSummary(session.results, vulnerabilityScores, session.wafDetection);

		exportData.analysis = {
			vulnerabilityScores,
			executiveSummary,
		};
	}

	const content = JSON.stringify(exportData, null, 2);
	const filename = generateFilename(session.url, 'json');
	downloadFile(content, filename, 'application/json');
}

function exportAsCSV(results) {
	if (results.length === 0) {
		showAlert('No results to export', 'Warning', 'warning');
		return;
	}

	const headers = [
		'Category',
		'Method',
		'Status',
		'Response Time (ms)',
		'Payload',
		'Is Redirect',
		'WAF Detected',
		'WAF Type',
		'Timestamp',
		'URL',
	];

	// Compute response time stats for summary rows
	let totalTime = 0, slowCount = 0, minTime = Infinity, maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	if (minTime === Infinity) minTime = 0;
	const avgTime = results.length > 0 ? Math.round(totalTime / results.length) : 0;

	const csvRows = [
		headers.join(','),
		...results.map((result) =>
			[
				`"${result.category}"`,
				`"${result.method}"`,
				result.status,
				result.responseTime || 0,
				`"${result.payload.replace(/"/g, '""')}"`,
				result.is_redirect || false,
				result.wafDetected || false,
				`"${result.wafType || ''}"`,
				`"${result.timestamp || ''}"`,
				`"${result.url || ''}"`,
			].join(','),
		),
		'',
		'"--- Results Summary ---"',
		`"Risk Level","${(() => { const bypassed = results.filter(r => r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500').length; const rate = results.length > 0 ? (bypassed / results.length) * 100 : 0; if (rate > 75) return 'Critical'; if (rate > 50) return 'High'; if (rate > 25) return 'Medium'; return 'Low'; })()} "`,
		`"WAF Effectiveness (%)",${results.length > 0 ? Math.round((100 - (results.filter(r => r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500').length / results.length) * 100) * 100) / 100 : 100}`,
		`"Total Tests",${results.length}`,
		`"Bypassed",${results.filter(r => r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500').length}`,
		'',
		'"--- Response Time Summary ---"',
		`"Avg Response Time (ms)",${avgTime}`,
		`"Min Response Time (ms)",${minTime}`,
		`"Max Response Time (ms)",${maxTime}`,
		`"Slow Requests (>${SLOW_RESPONSE_THRESHOLD}ms)",${slowCount}`,
	];

	const content = csvRows.join('\n');
	const filename = generateFilename(currentTestSession?.url || 'results', 'csv');
	downloadFile(content, filename, 'text/csv');
}

function exportAsHTMLReport(session) {
	const vulnerabilityScores = generateVulnerabilityScores(session.results, session.settings.falsePositiveTest);
	const executiveSummary = generateExecutiveSummary(session.results, vulnerabilityScores, session.wafDetection);

	const html = generateHTMLReport(session, vulnerabilityScores, executiveSummary);
	const filename = generateFilename(session.url, 'html');
	downloadFile(html, filename, 'text/html');

	showAlert("HTML report downloaded. Use your browser's Print to PDF feature to create a PDF.", 'Success', 'success');
}

function generateHTMLReport(session, vulnerabilityScores, executiveSummary) {
	const getRiskColor = (risk) => {
		switch (risk) {
			case 'Critical':
				return '#ff3860';
			case 'High':
				return '#ffb347';
			case 'Medium':
				return '#60a5fa';
			case 'Low':
				return '#00ff9d';
			default:
				return '#6b7280';
		}
	};

	const getStatusColor = (status, falsePositiveMode = false) => {
		const statusStr = String(status);
		const codeNum = parseInt(statusStr, 10);
		
		if (isNaN(codeNum)) {
			return 'rgba(249, 115, 22, 0.2)'; // Orange for errors
		}
		
		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) {
				return 'rgba(34, 197, 94, 0.2)'; // Green for allowed
			} else if (codeNum === 403) {
				return 'rgba(239, 68, 68, 0.2)'; // Red for blocked
			}
		} else {
			if (codeNum === 403) {
				return 'rgba(34, 197, 94, 0.2)'; // Green for protected
			} else if (codeNum >= 200 && codeNum < 300) {
				return 'rgba(239, 68, 68, 0.2)'; // Red for vulnerable
			}
		}
		
		if (codeNum >= 300 && codeNum < 400) {
			return 'rgba(249, 115, 22, 0.2)'; // Orange for redirects
		}
		
		return 'rgba(107, 114, 128, 0.1)'; // Gray for others
	};

	const getStatusBorderColor = (status, falsePositiveMode = false) => {
		const statusStr = String(status);
		const codeNum = parseInt(statusStr, 10);
		
		if (isNaN(codeNum)) {
			return '#f97316'; // Orange
		}
		
		if (falsePositiveMode) {
			if (codeNum >= 200 && codeNum < 300) {
				return '#22c55e'; // Green
			} else if (codeNum === 403) {
				return '#ef4444'; // Red
			}
		} else {
			if (codeNum === 403) {
				return '#22c55e'; // Green
			} else if (codeNum >= 200 && codeNum < 300) {
				return '#ef4444'; // Red
			}
		}
		
		if (codeNum >= 300 && codeNum < 400) {
			return '#f97316'; // Orange
		}
		
		return '#6b7280'; // Gray
	};

	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const duration = Math.round((endDate - startDate) / 1000);
	const falsePositiveMode = session.settings?.falsePositiveTest || false;

	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAF Security Assessment Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Outfit', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0a0e14 0%, #0f1629 50%, #0a0e14 100%);
            color: #e5e7eb;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #161b22 0%, #1c2128 100%);
            border: 1px solid rgba(0, 217, 255, 0.3);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #00d9ff;
            margin-bottom: 20px;
        }
        .header-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
            text-align: left;
        }
        .info-item {
            background: rgba(0, 217, 255, 0.05);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(0, 217, 255, 0.2);
        }
        .info-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 14px;
            color: #ffffff;
            font-weight: 500;
            font-family: 'JetBrains Mono', monospace;
        }
        .card {
            background: #161b22;
            border: 1px solid rgba(0, 217, 255, 0.3);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .card-title {
            font-size: 20px;
            font-weight: 700;
            color: #00d9ff;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .metric-card {
            background: rgba(0, 217, 255, 0.05);
            border: 1px solid rgba(0, 217, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: #00d9ff;
            margin-bottom: 8px;
        }
        .metric-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .risk-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            color: white;
            background-color: ${getRiskColor(executiveSummary.riskLevel)};
            margin: 20px 0;
        }
        .table-wrapper {
            overflow-x: auto;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        thead {
            background: rgba(0, 217, 255, 0.1);
        }
        th {
            padding: 15px;
            text-align: left;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
            border-bottom: 2px solid rgba(0, 217, 255, 0.3);
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(0, 217, 255, 0.1);
            color: #e5e7eb;
        }
        tbody tr:hover {
            background: rgba(0, 217, 255, 0.05);
        }
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
        }
        .severity-critical { background: rgba(255, 56, 96, 0.2); color: #ff3860; }
        .severity-high { background: rgba(255, 179, 71, 0.2); color: #ffb347; }
        .severity-medium { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
        .severity-low { background: rgba(0, 255, 157, 0.2); color: #00ff9d; }
        .recommendations {
            background: rgba(0, 217, 255, 0.05);
            border-left: 4px solid #00d9ff;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .recommendations ol {
            margin-left: 20px;
            color: #d1d5db;
        }
        .recommendations li {
            margin: 10px 0;
            line-height: 1.8;
        }
        .results-section {
            margin-top: 40px;
        }
        .result-row {
            border-left: 4px solid;
            transition: all 0.2s;
        }
        .status-code {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        .payload {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #9ca3af;
            word-break: break-all;
            max-width: 500px;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid rgba(0, 217, 255, 0.2);
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: #0a0e14; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ WAF Security Assessment Report</h1>
            <div class="header-info">
                <div class="info-item">
                    <div class="info-label">Target URL</div>
                    <div class="info-value">${escapeHtml(session.url)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Test Date</div>
                    <div class="info-value">${dateStr}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Test Time</div>
                    <div class="info-value">${startTimeStr} - ${endTimeStr}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Duration</div>
                    <div class="info-value">${duration} seconds</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">📊 Executive Summary</h2>
            <div style="text-align: center;">
                <span class="risk-badge">${executiveSummary.riskLevel} Risk Level</span>
            </div>
            <div class="metrics-grid">
                <div class="metric-card" style="border-color: ${getRiskColor(executiveSummary.riskLevel)}40; background: ${getRiskColor(executiveSummary.riskLevel)}15;">
                    <div class="metric-value" style="font-size: 28px; color: ${getRiskColor(executiveSummary.riskLevel)}">${executiveSummary.riskLevel}</div>
                    <div class="metric-label">Risk Level</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: ${executiveSummary.wafEffectiveness < 75 ? '#ffb347' : '#00ff9d'}">${executiveSummary.wafEffectiveness}%</div>
                    <div class="metric-label">WAF Effectiveness</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${executiveSummary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="color: ${executiveSummary.bypassedTests > 0 ? '#ff3860' : '#00ff9d'}">${executiveSummary.bypassedTests}</div>
                    <div class="metric-label">Bypassed</div>
                </div>
            </div>
            ${(() => {
				const results = session.results || [];
				let totalTime = 0, slowCount = 0, minT = Infinity, maxT = 0;
				for (const r of results) {
					const rt = r.responseTime || 0;
					totalTime += rt;
					if (rt >= 2000) slowCount++;
					if (rt < minT) minT = rt;
					if (rt > maxT) maxT = rt;
				}
				const avgT = results.length > 0 ? Math.round(totalTime / results.length) : 0;
				if (minT === Infinity) minT = 0;
				const avgColor = avgT >= 2000 ? '#ff3860' : avgT >= 1000 ? '#ffb347' : avgT >= 500 ? '#eab308' : '#00ff9d';
				return `
            <div class="metrics-grid" style="margin-top: 0;">
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: ${avgColor}">${avgT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: #00d9ff;">${minT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Fastest</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: #a78bfa;">${maxT}<span style="font-size: 14px; font-weight: 400;">ms</span></div>
                    <div class="metric-label">Slowest</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 28px; color: ${slowCount > 0 ? '#ffb347' : '#6b7280'};">${slowCount}</div>
                    <div class="metric-label">Slow Requests (&gt;2s)</div>
                </div>
            </div>`;
			})()}
        </div>

        ${
			session.wafDetection?.detected
				? `
        <div class="card">
            <h2 class="card-title">🔍 WAF Detection</h2>
            <div class="info-item" style="max-width: 500px;">
                <div class="info-label">Detected WAF</div>
                <div class="info-value">${escapeHtml(session.wafDetection.wafType)}</div>
            </div>
            <div class="info-item" style="max-width: 500px; margin-top: 15px;">
                <div class="info-label">Confidence</div>
                <div class="info-value">${session.wafDetection.confidence}%</div>
            </div>
        </div>
        `
				: ''
		}

        <div class="card">
            <h2 class="card-title">📋 Vulnerability Assessment</h2>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Severity</th>
                            <th>Score</th>
                            <th>Bypass Rate</th>
                            <th>Tests (Bypassed/Total)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vulnerabilityScores
									.map(
										(vuln) => `
                        <tr>
                            <td><strong>${escapeHtml(vuln.category)}</strong></td>
                            <td><span class="severity-badge severity-${vuln.severity.toLowerCase()}">${vuln.severity}</span></td>
                            <td>${vuln.score}/100</td>
                            <td style="color: ${vuln.bypassRate > 50 ? '#ff3860' : vuln.bypassRate > 20 ? '#ffb347' : '#00ff9d'}; font-weight: 700;">${vuln.bypassRate}%</td>
                            <td>${vuln.bypassedCount}/${vuln.totalCount}</td>
                        </tr>
                        `,
									)
									.join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">💡 Recommendations</h2>
            <div class="recommendations">
                <ol>
                    ${executiveSummary.recommendations.map((rec) => `<li>${escapeHtml(rec)}</li>`).join('')}
                </ol>
            </div>
        </div>

        <div class="card results-section">
            <h2 class="card-title">📝 Detailed Test Results</h2>
            <p style="color: #9ca3af; margin-bottom: 20px; font-size: 14px;">
                Complete list of all ${session.results.length} test requests executed during the security assessment.
            </p>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 20%;">Category</th>
                            <th style="width: 10%;">Method</th>
                            <th style="width: 10%;">Status</th>
                            <th style="width: 10%;">Time</th>
                            <th style="width: 50%;">Payload</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${session.results
									.map((result) => {
										const statusStr = String(result.status);
										const bgColor = getStatusColor(statusStr, falsePositiveMode);
										const borderColor = getStatusBorderColor(statusStr, falsePositiveMode);
										const statusClass = statusStr === '403' ? 'text-cyber-success' : 
														  (statusStr === '200' || statusStr === '201' || statusStr === '204') ? 'text-cyber-danger' : 
														  'text-orange-400';
										return `
                        <tr class="result-row" style="background-color: ${bgColor}; border-left-color: ${borderColor};">
                            <td><strong>${escapeHtml(result.category || 'N/A')}</strong></td>
                            <td style="font-family: 'JetBrains Mono', monospace; color: #00d9ff;">${escapeHtml(result.method || 'N/A')}</td>
                            <td><span class="status-code" style="color: ${statusClass === 'text-cyber-success' ? '#00ff9d' : statusClass === 'text-cyber-danger' ? '#ff3860' : '#ffb347'};">${escapeHtml(statusStr)}</span></td>
                            <td style="color: ${(result.responseTime || 0) >= 2000 ? '#ffb347' : '#9ca3af'}; font-weight: ${(result.responseTime || 0) >= 2000 ? '700' : '400'};">${result.responseTime || 0}ms${(result.responseTime || 0) >= 2000 ? ' <span style="background: rgba(255,179,71,0.2); color: #ffb347; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">SLOW</span>' : ''}</td>
                            <td><span class="payload">${escapeHtml(result.payload || 'N/A')}</span></td>
                        </tr>
                        `;
									})
									.join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            <p>Generated by WAF-CHECKER.COM by <a href="https://mickaelasseline.com" style="color: #00d9ff; text-decoration: none;">Mickael Asseline</a> • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateVulnerabilityScores(results, falsePositiveMode = false) {
	const categoryStats = new Map();

	results.forEach((result) => {
		const category = result.category;
		const stats = categoryStats.get(category) || { total: 0, bypassed: 0 };
		stats.total++;

		const isBypassed = falsePositiveMode
			? result.status === 403 || result.status === '403'
			: result.status === 200 || result.status === '200';

		if (isBypassed) {
			stats.bypassed++;
		}

		categoryStats.set(category, stats);
	});

	const scores = [];
	categoryStats.forEach((stats, category) => {
		const bypassRate = stats.total > 0 ? (stats.bypassed / stats.total) * 100 : 0;

		let severity, score;
		if (bypassRate >= 75) {
			severity = 'Critical';
			score = 90 + ((bypassRate - 75) / 25) * 10;
		} else if (bypassRate >= 50) {
			severity = 'High';
			score = 70 + ((bypassRate - 50) / 25) * 20;
		} else if (bypassRate >= 25) {
			severity = 'Medium';
			score = 40 + ((bypassRate - 25) / 25) * 30;
		} else {
			severity = 'Low';
			score = (bypassRate / 25) * 40;
		}

		scores.push({
			category,
			severity,
			score: Math.round(score),
			bypassedCount: stats.bypassed,
			totalCount: stats.total,
			bypassRate: Math.round(bypassRate * 100) / 100,
		});
	});

	return scores.sort((a, b) => b.score - a.score);
}

function generateExecutiveSummary(results, vulnerabilityScores, wafDetection) {
	const totalTests = results.length;
	const bypassedTests = results.filter((r) => r.status === 200 || r.status === '200' || r.status === 500 || r.status === '500').length;
	const bypassRate = totalTests > 0 ? (bypassedTests / totalTests) * 100 : 0;
	const wafEffectiveness = Math.max(0, 100 - bypassRate);

	const criticalVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Critical').length;
	const highVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'High').length;
	const mediumVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Medium').length;
	const lowVulnerabilities = vulnerabilityScores.filter((v) => v.severity === 'Low').length;

	let riskLevel, overallScore;
	if (criticalVulnerabilities > 0 || bypassRate > 75) {
		riskLevel = 'Critical';
		overallScore = 10;
	} else if (highVulnerabilities > 0 || bypassRate > 50) {
		riskLevel = 'High';
		overallScore = 30;
	} else if (mediumVulnerabilities > 0 || bypassRate > 25) {
		riskLevel = 'Medium';
		overallScore = 60;
	} else {
		riskLevel = 'Low';
		overallScore = 90;
	}

	const recommendations = [];
	if (criticalVulnerabilities > 0) {
		recommendations.push('Immediately review and update WAF rules for critical vulnerabilities');
	}
	if (bypassRate > 50) {
		recommendations.push('WAF configuration needs significant improvement');
	}
	if (!wafDetection?.detected) {
		recommendations.push('Consider implementing a Web Application Firewall');
	}

	vulnerabilityScores.slice(0, 3).forEach((vuln) => {
		if (vuln.severity === 'Critical' || vuln.severity === 'High') {
			recommendations.push(`Strengthen protection against ${vuln.category} attacks`);
		}
	});

	if (recommendations.length === 0) {
		recommendations.push('WAF is performing well, continue monitoring');
	}

	// Response time stats
	let totalTime = 0, slowCount = 0, minTime = Infinity, maxTime = 0;
	for (const r of results) {
		const rt = r.responseTime || 0;
		totalTime += rt;
		if (rt >= SLOW_RESPONSE_THRESHOLD) slowCount++;
		if (rt < minTime) minTime = rt;
		if (rt > maxTime) maxTime = rt;
	}
	if (minTime === Infinity) minTime = 0;
	const avgResponseTime = totalTests > 0 ? Math.round(totalTime / totalTests) : 0;

	return {
		riskLevel,
		wafEffectiveness: Math.round(wafEffectiveness * 100) / 100,
		totalTests,
		bypassedTests,
		overallScore,
		bypassRate: Math.round(bypassRate * 100) / 100,
		criticalVulnerabilities,
		highVulnerabilities,
		mediumVulnerabilities,
		lowVulnerabilities,
		recommendations: recommendations.slice(0, 5),
		responseTimeStats: {
			avgResponseTime,
			minResponseTime: minTime,
			maxResponseTime: maxTime,
			slowRequests: slowCount,
			slowThresholdMs: SLOW_RESPONSE_THRESHOLD,
		},
	};
}

function showAnalytics() {
	if (!currentTestSession) {
		showAlert('No test results to analyze', 'Warning', 'warning');
		return;
	}

	const vulnerabilityScores = generateVulnerabilityScores(currentTestSession.results, currentTestSession.settings.falsePositiveTest);
	const executiveSummary = generateExecutiveSummary(currentTestSession.results, vulnerabilityScores, currentTestSession.wafDetection);

	const modal = document.getElementById('analyticsModal');
	const content = document.getElementById('analyticsContent');

	if (!modal || !content) return;

	content.innerHTML = generateAnalyticsHTML(currentTestSession, vulnerabilityScores, executiveSummary);
	modal.style.display = 'flex';
	document.body.style.overflow = 'hidden';
}

function hideAnalytics() {
	const modal = document.getElementById('analyticsModal');
	if (modal) {
		modal.style.display = 'none';
		document.body.style.overflow = '';
	}
}

async function exportAnalyticsScreenshot(event) {
	const content = document.getElementById('analyticsContent');
	if (!content) {
		showAlert('No analytics content to export', 'Warning', 'warning');
		return;
	}

	let btn = null;
	let oldText = '';
	
	try {
		// Show loading state
		if (event && event.target) {
			btn = event.target.closest('button');
			if (btn) {
				oldText = btn.innerHTML;
				btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Exporting...`;
				btn.disabled = true;
			}
		}

		// Wait a moment for any animations to complete
		await new Promise(resolve => setTimeout(resolve, 300));

		// Create a wrapper for better capture
		const wrapper = document.createElement('div');
		const contentWidth = Math.max(content.scrollWidth || 1200, 1200);
		wrapper.style.cssText = `
			background: linear-gradient(135deg, #0a0e1a 0%, #0f1629 50%, #0a0e1a 100%);
			padding: 40px;
			width: ${contentWidth + 80}px;
			position: fixed;
			left: 0;
			top: 0;
			visibility: hidden;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			z-index: -9999;
		`;
		
		// Add header to screenshot
		const header = document.createElement('div');
		const now = new Date();
		const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
		const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
		header.innerHTML = `
			<div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid rgba(0, 255, 255, 0.3);">
				<div style="width: 50px; height: 50px; background: rgba(0, 255, 255, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ffff" stroke-width="2">
						<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<div>
					<div style="font-size: 22px; font-weight: bold; color: white; font-family: system-ui, -apple-system, sans-serif; margin-bottom: 4px;">WAF Security Analytics</div>
					<div style="font-size: 13px; color: #9ca3af; font-family: system-ui, -apple-system, sans-serif;">Generated by WAF-CHECKER.COM • ${dateStr} at ${timeStr}</div>
				</div>
			</div>
		`;
		wrapper.appendChild(header);
		
		// Clone the content
		const clone = content.cloneNode(true);
		clone.style.cssText = `
			max-width: 100%;
			width: ${contentWidth}px;
			margin: 0 auto;
		`;
		
		// Ensure all computed styles are applied for screenshot
		wrapper.appendChild(clone);
		
		// Add footer
		const footer = document.createElement('div');
		footer.innerHTML = `
			<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(0, 255, 255, 0.2); text-align: center;">
				<span style="font-size: 12px; color: #6b7280; font-family: system-ui, -apple-system, sans-serif;">WAF-CHECKER.COM by Mickael Asseline</span>
			</div>
		`;
		wrapper.appendChild(footer);
		
		document.body.appendChild(wrapper);

		// Wait for layout to settle and ensure fonts are loaded
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Make wrapper visible temporarily for capture
		wrapper.style.visibility = 'visible';
		wrapper.style.position = 'fixed';
		wrapper.style.left = '0';
		wrapper.style.top = '0';
		
		// Force a reflow to ensure all styles are computed
		const height = wrapper.offsetHeight;
		const width = wrapper.offsetWidth;

		// Capture the wrapper
		const canvas = await html2canvas(wrapper, {
			backgroundColor: '#0a0e1a',
			scale: 2,
			useCORS: true,
			logging: false,
			allowTaint: true,
			width: width,
			height: height,
			foreignObjectRendering: true,
			onclone: (clonedDoc) => {
				// Apply computed styles to cloned elements
				const clonedWrapper = clonedDoc.body.querySelector('div');
				if (clonedWrapper) {
					clonedWrapper.style.position = 'relative';
					clonedWrapper.style.left = '0';
					clonedWrapper.style.top = '0';
					clonedWrapper.style.visibility = 'visible';
				}
			}
		});
		
		// Remove wrapper
		document.body.removeChild(wrapper);

		// Convert to blob
		canvas.toBlob(async (blob) => {
			if (!blob) {
				throw new Error('Failed to create blob from canvas');
			}

			// Download the file
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			
			// Generate filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
			let hostname = 'analytics';
			try {
				hostname = new URL(currentTestSession?.url || '').hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
			} catch {}
			link.download = `waf-analytics_${hostname}_${timestamp}.png`;
			
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			// Copy to clipboard
			let clipboardSuccess = false;
			try {
				// Check if ClipboardItem is supported
				if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
					// Create clipboard item with blob promise
					const clipboardItem = new ClipboardItem({ 'image/png': Promise.resolve(blob) });
					await navigator.clipboard.write([clipboardItem]);
					clipboardSuccess = true;
				} else {
					throw new Error('ClipboardItem not supported');
				}
			} catch (clipboardError) {
				console.warn('Clipboard copy failed:', clipboardError);
				// ClipboardItem might not be supported, that's okay
			}

			// Restore button
			if (btn) {
				btn.innerHTML = oldText;
				btn.disabled = false;
			}

			// Show success message
			if (clipboardSuccess) {
				showAlert('Analytics screenshot exported and copied to clipboard!', 'Success', 'success');
			} else {
				showAlert('Analytics screenshot exported successfully! (Clipboard copy requires HTTPS)', 'Success', 'success');
			}
		}, 'image/png');

	} catch (error) {
		console.error('Screenshot export failed:', error);
		showAlert(`Failed to export screenshot: ${error.message}`, 'Error', 'error');
		
		// Restore button
		if (btn) {
			btn.innerHTML = oldText;
			btn.disabled = false;
		}
	}
}

function generateAnalyticsHTML(session, vulnerabilityScores, summary) {
	// Format date and time
	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
	const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	const duration = Math.round((endDate - startDate) / 1000);
	
	// Risk level styling
	const riskColors = {
		'Critical': 'bg-cyber-danger/20 text-cyber-danger border-cyber-danger/30',
		'High': 'bg-cyber-warning/20 text-cyber-warning border-cyber-warning/30',
		'Medium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
		'Low': 'bg-cyber-success/20 text-cyber-success border-cyber-success/30'
	};
	const riskStyle = riskColors[summary.riskLevel] || riskColors['Low'];
	
	return `
		<!-- Test Info Header -->
		<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 mb-4">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 rounded-lg bg-cyber-accent/20 flex items-center justify-center">
					<svg class="w-5 h-5 text-cyber-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-sm font-bold text-white">Security Analysis Report</h3>
					<p class="text-xs text-gray-400">Detailed vulnerability assessment</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
				<div class="bg-cyber-elevated/50 rounded-lg p-3">
					<div class="text-gray-400 mb-1">Target URL</div>
					<div class="text-cyber-accent font-mono truncate" title="${escapeHtml(session.url)}">${escapeHtml(session.url)}</div>
				</div>
				<div class="bg-cyber-elevated/50 rounded-lg p-3">
					<div class="text-gray-400 mb-1">Date</div>
					<div class="text-white font-medium">${dateStr}</div>
				</div>
				<div class="bg-cyber-elevated/50 rounded-lg p-3">
					<div class="text-gray-400 mb-1">Time</div>
					<div class="text-white font-medium">${startTimeStr} - ${endTimeStr} <span class="text-gray-500">(${duration}s)</span></div>
				</div>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
			<div class="bg-cyber-card border ${riskStyle} rounded-xl p-4 text-center">
				<div class="text-lg font-bold mb-1">${summary.riskLevel}</div>
				<div class="text-xs text-gray-400 uppercase tracking-wider">Risk Level</div>
			</div>
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold ${summary.wafEffectiveness < 75 ? 'text-cyber-warning' : 'text-cyber-success'} mb-1">${summary.wafEffectiveness}%</div>
				<div class="text-xs text-gray-400 uppercase tracking-wider">WAF Effectiveness</div>
			</div>
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-4 text-center">
				<div class="text-2xl font-bold text-white mb-1">${summary.totalTests}</div>
				<div class="text-xs text-gray-400 uppercase tracking-wider">Total Tests</div>
			</div>
			<div class="bg-cyber-card border ${summary.bypassedTests > 0 ? 'border-cyber-danger/30' : 'border-cyber-success/30'} rounded-xl p-4 text-center">
				<div class="text-2xl font-bold ${summary.bypassedTests > 0 ? 'text-cyber-danger' : 'text-cyber-success'} mb-1">${summary.bypassedTests}</div>
				<div class="text-xs text-gray-400 uppercase tracking-wider">Bypassed</div>
			</div>
		</div>

		<!-- Response Time Stats -->
		${(() => {
			const rts = summary.responseTimeStats || {};
			const avg = rts.avgResponseTime || 0;
			const min = rts.minResponseTime || 0;
			const max = rts.maxResponseTime || 0;
			const slow = rts.slowRequests || 0;
			const threshold = rts.slowThresholdMs || 2000;
			let avgColor = 'text-cyber-success';
			if (avg >= threshold) avgColor = 'text-red-400';
			else if (avg >= 1000) avgColor = 'text-orange-400';
			else if (avg >= 500) avgColor = 'text-yellow-400';
			return `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl p-2 text-center">
				<div class="text-base font-bold ${avgColor} font-mono">${avg}<span class="text-[10px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Avg Response</div>
			</div>
			<div class="bg-cyber-card border border-cyan-500/20 rounded-xl p-2 text-center">
				<div class="text-base font-bold text-cyan-400 font-mono">${min}<span class="text-[10px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Fastest</div>
			</div>
			<div class="bg-cyber-card border border-purple-500/20 rounded-xl p-2 text-center">
				<div class="text-base font-bold text-purple-400 font-mono">${max}<span class="text-[10px] font-normal">ms</span></div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slowest</div>
			</div>
			<div class="bg-cyber-card border ${slow > 0 ? 'border-orange-500/30' : 'border-gray-500/20'} rounded-xl p-2 text-center">
				<div class="text-base font-bold ${slow > 0 ? 'text-orange-400' : 'text-gray-500'} font-mono">${slow}</div>
				<div class="text-[9px] text-gray-400 uppercase tracking-wide">Slow (>${threshold/1000}s)</div>
			</div>
		</div>`;
		})()}

		<!-- Two Column Layout -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			<!-- Vulnerability Breakdown -->
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
				<div class="px-4 py-3 border-b border-cyber-accent/20 bg-cyber-elevated/30">
					<h4 class="text-sm font-bold text-white">Vulnerability Breakdown</h4>
				</div>
				<div class="p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">Critical</span>
						<span class="px-2 py-0.5 bg-cyber-danger/20 text-cyber-danger text-xs font-bold rounded">${summary.criticalVulnerabilities}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">High</span>
						<span class="px-2 py-0.5 bg-cyber-warning/20 text-cyber-warning text-xs font-bold rounded">${summary.highVulnerabilities}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">Medium</span>
						<span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">${summary.mediumVulnerabilities}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">Low</span>
						<span class="px-2 py-0.5 bg-cyber-success/20 text-cyber-success text-xs font-bold rounded">${summary.lowVulnerabilities}</span>
					</div>
				</div>
			</div>

			<!-- Recommendations -->
			<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
				<div class="px-4 py-3 border-b border-cyber-accent/20 bg-cyber-elevated/30">
					<h4 class="text-sm font-bold text-white">Recommendations</h4>
				</div>
				<div class="p-4">
					<ul class="space-y-2">
						${summary.recommendations.map((rec) => `
							<li class="flex items-start gap-2 text-xs text-gray-300">
								<svg class="w-4 h-4 text-cyber-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
								${rec}
							</li>
						`).join('')}
					</ul>
				</div>
			</div>
		</div>

		<!-- Category Analysis Table -->
		<div class="bg-cyber-card border border-cyber-accent/20 rounded-xl overflow-hidden">
			<div class="px-4 py-3 border-b border-cyber-accent/20 bg-cyber-elevated/30">
				<h4 class="text-sm font-bold text-white">Category Analysis</h4>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm" style="table-layout: fixed; width: 100%;">
					<colgroup>
						<col style="width: 40%;">
						<col style="width: 20%;">
						<col style="width: 20%;">
						<col style="width: 20%;">
					</colgroup>
					<thead>
						<tr class="border-b border-cyber-accent/20 bg-cyber-elevated/20">
							<th class="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider" style="text-align: left;">Category</th>
							<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style="text-align: center;">Severity</th>
							<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style="text-align: center;">Score</th>
							<th class="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider" style="text-align: center;">Bypass Rate</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-cyber-accent/10">
						${vulnerabilityScores.map((vuln) => {
							const severityColors = {
								'Critical': 'bg-cyber-danger/20 text-cyber-danger',
								'High': 'bg-cyber-warning/20 text-cyber-warning',
								'Medium': 'bg-blue-500/20 text-blue-400',
								'Low': 'bg-cyber-success/20 text-cyber-success'
							};
							const sevStyle = severityColors[vuln.severity] || severityColors['Low'];
							const bypassColor = vuln.bypassRate > 50 ? 'text-cyber-danger' : vuln.bypassRate > 20 ? 'text-cyber-warning' : 'text-cyber-success';
							return `
								<tr class="hover:bg-cyber-elevated/30 transition-colors">
									<td class="px-4 py-2.5 text-gray-300" style="text-align: left; word-wrap: break-word;">${escapeHtml(vuln.category)}</td>
									<td class="px-4 py-2.5 text-center" style="text-align: center;">
										<span class="px-2 py-0.5 ${sevStyle} text-xs font-bold rounded">${vuln.severity}</span>
									</td>
									<td class="px-4 py-2.5 text-center text-gray-300" style="text-align: center;">${vuln.score}/100</td>
									<td class="px-4 py-2.5 text-center font-bold ${bypassColor}" style="text-align: center;">${vuln.bypassRate}%</td>
								</tr>
							`;
						}).join('')}
					</tbody>
				</table>
			</div>
		</div>
	`;
}

function downloadFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function generateFilename(baseUrl, extension) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
	let hostname;
	try {
		hostname = new URL(baseUrl).hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
	} catch {
		hostname = 'results';
	}
	return `waf-report_${hostname}_${timestamp}.${extension}`;
}

// Batch Testing Functions
function showBatchModal() {
	const modal = new bootstrap.Modal(document.getElementById('batchModal'));
	modal.show();

	// Reset modal state
	document.getElementById('batchProgress').style.display = 'none';
	document.getElementById('batchResults').style.display = 'none';
	document.getElementById('startBatchBtn').style.display = 'inline-block';
	document.getElementById('stopBatchBtn').style.display = 'none';
	document.getElementById('exportBatchBtn').style.display = 'none';

	// Load sample URLs if empty
	const urlsTextarea = document.getElementById('batchUrls');
	if (!urlsTextarea.value.trim()) {
		urlsTextarea.value = 'https://httpbin.org/get\nhttps://jsonplaceholder.typicode.com/posts/1\nhttps://httpbin.org/status/200';
	}

	// Add real-time URL validation feedback
	urlsTextarea.addEventListener('input', function () {
		validateBatchUrls();
	});
}

async function startBatchTest() {
	const urlsText = document.getElementById('batchUrls').value;
	const maxConcurrent = parseInt(document.getElementById('batchMaxConcurrent').value);
	const delay = parseInt(document.getElementById('batchDelay').value);
	const inheritSettings = document.getElementById('batchInheritSettings').checked;

	// Parse and validate URLs
	const allLines = urlsText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (allLines.length === 0) {
		showAlert('Please enter at least one URL', 'Warning', 'warning');
		return;
	}

	// Validate URLs client-side
	const validUrls = [];
	const invalidUrls = [];

	allLines.forEach((line) => {
		try {
			// Normalize URL by adding https:// if no scheme is present
			const normalizedUrl = normalizeUrl(line);
			
			const url = new URL(normalizedUrl);
			if (url.protocol === 'http:' || url.protocol === 'https:') {
				validUrls.push(normalizedUrl);
			} else {
				invalidUrls.push(`${line} (unsupported protocol: ${url.protocol})`);
			}
		} catch (error) {
			invalidUrls.push(`${line} (invalid URL format)`);
		}
	});

	// Show validation results
	if (invalidUrls.length > 0) {
		const message = `Found ${invalidUrls.length} invalid URL(s):\n\n${invalidUrls.slice(0, 5).join('\n')}${
			invalidUrls.length > 5 ? `\n... and ${invalidUrls.length - 5} more` : ''
		}\n\nContinue with ${validUrls.length} valid URLs?`;

		const confirmed = await showConfirm(message, 'Invalid URLs Found', 'warning');
		if (!confirmed) {
			return;
		}
	}

	if (validUrls.length === 0) {
		showAlert('No valid URLs found. Please check your input.', 'Error', 'error');
		return;
	}

	if (validUrls.length > 100) {
		showAlert('Maximum 100 URLs allowed for batch testing', 'Warning', 'warning');
		return;
	}

	const urls = validUrls;

	// Prepare batch configuration
	const config = {
		maxConcurrent,
		delayBetweenRequests: delay,
	};

	if (inheritSettings) {
		const methodCheckboxes = document.querySelectorAll('.http-methods input[type=checkbox]');
		const selectedMethods = Array.from(methodCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);

		const categoryCheckboxes = document.querySelectorAll('#categoryCheckboxes input[type=checkbox]');
		const selectedCategories = Array.from(categoryCheckboxes)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);

		config.methods = selectedMethods;
		config.categories = selectedCategories;
		config.followRedirect = document.getElementById('followRedirect')?.checked || false;
		config.falsePositiveTest = document.getElementById('falsePositiveTest')?.checked || false;
		config.caseSensitiveTest = document.getElementById('caseSensitiveTest')?.checked || false;
		config.enhancedPayloads = document.getElementById('enhancedPayloads')?.checked || false;
		config.useAdvancedPayloads = document.getElementById('useAdvancedPayloadsCheckbox')?.checked || false;
		config.autoDetectWAF = document.getElementById('autoDetectWAF')?.checked || false;
		config.useEncodingVariations = document.getElementById('useEncodingVariations')?.checked || false;
		config.httpManipulation = document.getElementById('httpManipulation')?.checked || false;
		config.payloadTemplate = document.getElementById('payloadTemplate')?.value || '';
		config.customHeaders = document.getElementById('customHeaders')?.value || '';
	} else {
		config.methods = ['GET'];
		config.categories = ['SQL Injection', 'XSS'];
		config.followRedirect = false;
		config.falsePositiveTest = false;
		config.caseSensitiveTest = false;
		config.enhancedPayloads = false;
		config.useAdvancedPayloads = false;
		config.autoDetectWAF = false;
		config.useEncodingVariations = false;
		config.httpManipulation = false;
	}

	try {
		// Initialize client-side batch processing
		currentBatchJob = {
			urls: urls,
			config: config,
			results: [],
			currentIndex: 0,
			completedCount: 0,
			startTime: new Date().toISOString(),
			status: 'running',
		};

		// Update UI
		document.getElementById('batchProgress').style.display = 'block';
		document.getElementById('startBatchBtn').style.display = 'none';
		document.getElementById('stopBatchBtn').style.display = 'inline-block';
		document.getElementById('batchTotal').textContent = urls.length;

		// Reset progress display
		document.getElementById('batchProgressText').textContent = '0%';
		document.getElementById('batchProgressBar').style.width = '0%';
		document.getElementById('batchProgressBar').classList.add('progress-bar-animated');
		document.getElementById('batchCurrentUrl').textContent = 'Starting...';
		document.getElementById('batchCompleted').textContent = '0';
		document.getElementById('batchETA').textContent = 'Calculating...';

		// Start client-side batch processing
		startClientSideBatchProcessing();

		console.log(`Started client-side batch test with ${urls.length} URLs`);
	} catch (error) {
		console.error('Batch test failed:', error);

		// Show a more user-friendly error message
		const errorLines = error.message.split('\n');
		const mainError = errorLines[0];
		const details = errorLines.slice(1).join('\n');

		let alertMessage = `Failed to start batch test: ${mainError}`;
		if (details.trim()) {
			alertMessage += `\n\nDetails:${details}`;
		}

		showAlert(alertMessage, 'Batch Test Complete', 'success');

		// Reset UI state
		document.getElementById('batchProgress').style.display = 'none';
		document.getElementById('startBatchBtn').style.display = 'inline-block';
		document.getElementById('stopBatchBtn').style.display = 'none';
	}
}

async function stopBatchTest() {
	if (!currentBatchJob) return;

	try {
		// Stop client-side processing
		if (currentBatchJob) {
			currentBatchJob.status = 'stopped';
		}

		if (batchPollInterval) {
			clearInterval(batchPollInterval);
			batchPollInterval = null;
		}

		document.getElementById('startBatchBtn').style.display = 'inline-block';
		document.getElementById('stopBatchBtn').style.display = 'none';

		console.log('Batch test stopped by user');
	} catch (error) {
		console.error('Failed to stop batch test:', error);
	}
}

async function startClientSideBatchProcessing() {
	if (!currentBatchJob || currentBatchJob.status !== 'running') return;

	const { urls, config } = currentBatchJob;
	const delay = config.delayBetweenRequests || 1000;

	// Process URLs sequentially with delay
	for (let i = 0; i < urls.length && currentBatchJob.status === 'running'; i++) {
		const url = urls[i];
		currentBatchJob.currentIndex = i;

		// Update current URL display
		updateBatchProgress(url, i, urls.length);

		try {
			// Test single URL
			const result = await testSingleUrlClient(url, config);

			if (currentBatchJob.status === 'running') {
				currentBatchJob.results.push({
					url: url,
					success: true,
					results: result,
					timestamp: new Date().toISOString(),
					totalTests: result.length,
					bypassedTests: result.filter((r) => r.status === 200 || r.status === '200').length,
					bypassRate:
						result.length > 0 ? Math.round((result.filter((r) => r.status === 200 || r.status === '200').length / result.length) * 100) : 0,
				});

				currentBatchJob.completedCount++;
			}
		} catch (error) {
			console.error(`Error testing URL ${url}:`, error);

			if (currentBatchJob.status === 'running') {
				currentBatchJob.results.push({
					url: url,
					success: false,
					error: error.message,
					timestamp: new Date().toISOString(),
					totalTests: 0,
					bypassedTests: 0,
					bypassRate: 0,
				});

				currentBatchJob.completedCount++;
			}
		}

		// Apply delay between requests (except for the last one)
		if (i < urls.length - 1 && delay > 0 && currentBatchJob.status === 'running') {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	// Mark as completed
	if (currentBatchJob.status === 'running') {
		currentBatchJob.status = 'completed';
		finalizeBatchTest();
	}
}

function updateBatchProgress(currentUrl, completed, total) {
	const progress = Math.round((completed / total) * 100);

	const progressText = document.getElementById('batchProgressText');
	const progressBar = document.getElementById('batchProgressBar');
	const currentUrlElement = document.getElementById('batchCurrentUrl');
	const completedElement = document.getElementById('batchCompleted');
	const eta = document.getElementById('batchETA');

	if (progressText) progressText.textContent = `${progress}%`;
	if (progressBar) {
		progressBar.style.width = `${progress}%`;
		if (progress > 0) {
			progressBar.classList.remove('bg-secondary');
			progressBar.classList.add('bg-primary');
		}
	}
	if (currentUrlElement) {
		const displayUrl = currentUrl.length > 50 ? currentUrl.substring(0, 47) + '...' : currentUrl;
		currentUrlElement.textContent = displayUrl;
		currentUrlElement.title = currentUrl;
	}
	if (completedElement) completedElement.textContent = completed;

	// Calculate ETA
	if (completed > 0 && currentBatchJob) {
		const elapsed = Date.now() - new Date(currentBatchJob.startTime).getTime();
		const avgTimePerUrl = elapsed / completed;
		const remaining = (total - completed) * avgTimePerUrl;
		const delayTime = (total - completed - 1) * (currentBatchJob.config.delayBetweenRequests || 0);
		const totalRemaining = remaining + delayTime;

		if (eta) eta.textContent = formatDuration(totalRemaining);
	}
}

async function testSingleUrlClient(url, config) {
	const methods = config.methods || ['GET'];
	const categories = config.categories || ['SQL Injection', 'XSS'];

	// Get custom payloads from localStorage
	let customPayloadsData = {};
	try {
		const stored = localStorage.getItem('wafchecker_customPayloads');
		if (stored) {
			customPayloadsData = JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load custom payloads:', e);
	}

	let allResults = [];
	let page = 0;

	while (true) {
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

		const response = await fetch(`/api/check?${params.toString()}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				payloadTemplate: config.payloadTemplate || '',
				customHeaders: config.customHeaders || '',
				customPayloads: customPayloadsData,
			}),
		});

		if (!response.ok) break;

		const results = await response.json();
		if (!results || !results.length) break;

		allResults = allResults.concat(results);
		page++;

		// Limit results to prevent memory issues
		if (allResults.length > 1000) break;
	}

	return allResults;
}

function finalizeBatchTest() {
	if (!currentBatchJob) return;

	// Update UI
	const startBtn = document.getElementById('startBatchBtn');
	const stopBtn = document.getElementById('stopBatchBtn');
	const exportBtn = document.getElementById('exportBatchBtn');

	if (startBtn) startBtn.style.display = 'inline-block';
	if (stopBtn) stopBtn.style.display = 'none';
	if (exportBtn) exportBtn.style.display = 'inline-block';

	// Final progress update
	const progressText = document.getElementById('batchProgressText');
	const progressBar = document.getElementById('batchProgressBar');
	const currentUrl = document.getElementById('batchCurrentUrl');
	const eta = document.getElementById('batchETA');

	if (progressText) progressText.textContent = '100%';
	if (progressBar) {
		progressBar.style.width = '100%';
		progressBar.classList.remove('progress-bar-animated', 'bg-primary');
		progressBar.classList.add(currentBatchJob.status === 'completed' ? 'bg-success' : 'bg-warning');
	}
	if (currentUrl) {
		currentUrl.textContent =
			currentBatchJob.status === 'completed'
				? 'All tests completed'
				: currentBatchJob.status === 'stopped'
					? 'Test stopped by user'
					: 'Test completed with errors';
	}
	if (eta) eta.textContent = 'Done';

	// Show results
	displayBatchResults({
		status: currentBatchJob.status,
		results: currentBatchJob.results,
		totalUrls: currentBatchJob.urls.length,
		completedUrls: currentBatchJob.completedCount,
		progress: 100,
	});

	console.log(`Batch test ${currentBatchJob.status}:`, currentBatchJob.results);
}

function displayBatchResults(job) {
	const resultsDiv = document.getElementById('batchResults');
	const summaryDiv = document.getElementById('batchSummary');

	if (!resultsDiv || !summaryDiv) return;

	const successful = job.results.filter((r) => r.success);
	const failed = job.results.filter((r) => !r.success);

	let html = `
		<div class="row">
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-primary">${job.totalUrls}</div>
					<small>Total URLs</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-success">${successful.length}</div>
					<small>Successful</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-danger">${failed.length}</div>
					<small>Failed</small>
				</div>
			</div>
			<div class="col-md-3">
				<div class="text-center">
					<div class="h4 text-info">${job.progress}%</div>
					<small>Progress</small>
				</div>
			</div>
		</div>
	`;

	if (successful.length > 0) {
		const avgBypassRate = successful.reduce((sum, r) => sum + (r.bypassRate || 0), 0) / successful.length;
		html += `<div class="mt-3"><strong>Average Bypass Rate:</strong> ${Math.round(avgBypassRate * 100) / 100}%</div>`;
	}

	summaryDiv.innerHTML = html;
	resultsDiv.style.display = 'block';
}

function exportBatchResults() {
	if (!currentBatchJob || !currentBatchJob.results) {
		showAlert('No batch results to export', 'Warning', 'warning');
		return;
	}

	const summary = generateBatchSummary(currentBatchJob.results);
	const exportData = {
		summary,
		results: currentBatchJob.results,
		exportedAt: new Date().toISOString(),
		version: '1.0.0',
	};

	const content = JSON.stringify(exportData, null, 2);
	const filename = `batch-results_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}.json`;
	downloadFile(content, filename, 'application/json');
}

function generateBatchSummary(results) {
	const successful = results.filter((r) => r.success);
	const failed = results.filter((r) => !r.success);

	const totalTestCases = successful.reduce((sum, r) => sum + (r.results?.length || 0), 0);
	const avgBypassRate = successful.length > 0 ? successful.reduce((sum, r) => sum + (r.bypassRate || 0), 0) / successful.length : 0;

	return {
		totalUrls: results.length,
		successfulTests: successful.length,
		failedTests: failed.length,
		totalTestCases,
		averageBypassRate: Math.round(avgBypassRate * 100) / 100,
	};
}

function formatDuration(milliseconds) {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	} else {
		return `${seconds}s`;
	}
}

function validateBatchUrls() {
	const urlsText = document.getElementById('batchUrls').value;
	const lines = urlsText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	let validCount = 0;
	let invalidCount = 0;

	lines.forEach((line) => {
		try {
			// Normalize URL by adding https:// if no scheme is present
			const normalizedUrl = normalizeUrl(line);
			new URL(normalizedUrl);
			validCount++;
		} catch (error) {
			invalidCount++;
		}
	});

	// Update UI with validation status
	const startBtn = document.getElementById('startBatchBtn');
	if (startBtn) {
		if (validCount === 0 && lines.length > 0) {
			startBtn.disabled = true;
			startBtn.textContent = 'No Valid URLs';
		} else if (validCount > 100) {
			startBtn.disabled = true;
			startBtn.textContent = `Too Many URLs (${validCount}/100)`;
		} else {
			startBtn.disabled = false;
			startBtn.textContent = validCount > 0 ? `Start Batch Test (${validCount} URLs)` : 'Start Batch Test';
		}
	}

	// Show validation summary
	const urlsTextarea = document.getElementById('batchUrls');
	if (urlsTextarea && lines.length > 0) {
		if (invalidCount > 0) {
			urlsTextarea.style.borderColor = '#ffc107';
			urlsTextarea.title = `${validCount} valid, ${invalidCount} invalid URLs`;
		} else {
			urlsTextarea.style.borderColor = '#198754';
			urlsTextarea.title = `${validCount} valid URLs`;
		}
	} else if (urlsTextarea) {
		urlsTextarea.style.borderColor = '';
		urlsTextarea.title = '';
	}
}

// ===========================================
// TEST CONFIGURATION MODAL
// ===========================================

let testConfigModal = null;
let currentEditingCategory = null;
let customPayloads = {};
let defaultPayloads = {};
let defaultPayloadsLoaded = false;

// Initialize custom payloads from localStorage
function initCustomPayloads() {
	const stored = localStorage.getItem('wafchecker_customPayloads');
	if (stored) {
		try {
			customPayloads = JSON.parse(stored);
		} catch (e) {
			customPayloads = {};
		}
	}
}

// Load default payloads from server
async function loadDefaultPayloads() {
	if (defaultPayloadsLoaded) return;
	
	try {
		const response = await fetch('/api/payloads');
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		if (!data || Object.keys(data).length === 0) throw new Error('Empty data');
		defaultPayloads = data;
		defaultPayloadsLoaded = true;
		
		// Update PAYLOAD_CATEGORIES with any new categories from server
		const serverCategories = Object.keys(defaultPayloads);
		serverCategories.forEach(cat => {
			if (!PAYLOAD_CATEGORIES.includes(cat)) {
				PAYLOAD_CATEGORIES.push(cat);
			}
		});
	} catch (e) {
		console.error('Failed to load default payloads:', e);
		showAlert('Failed to load payloads from GitHub. Click "Retry" in the Attack Categories panel to try again.', 'Payload Loading Error', 'warning');
	}
}

// Show test configuration modal
async function showTestConfigModal() {
	initCustomPayloads();
	
	// Show modal first with loading state
	if (!testConfigModal) {
		testConfigModal = new bootstrap.Modal(document.getElementById('testConfigModal'));
	}
	
	testConfigModal.show();

	// Reset mobile navigation to categories list
	const configContainer = document.querySelector('#testConfigModal .modal-body > div');
	if (configContainer) configContainer.classList.remove('config-editing');
	
	// Show loading state
	const categoryList = document.getElementById('configCategoryList');
	if (categoryList) {
		categoryList.innerHTML = '<div class="text-center py-4 text-gray-500 text-sm">Loading payloads...</div>';
	}
	
	// Load default payloads from server
	await loadDefaultPayloads();
	
	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
}

// Render category list in sidebar
function renderConfigCategoryList() {
	const container = document.getElementById('configCategoryList');
	if (!container) return;
	
	// Combine default payloads, PAYLOAD_CATEGORIES and custom categories
	const allCategories = new Set([
		...Object.keys(defaultPayloads),
		...PAYLOAD_CATEGORIES, 
		...Object.keys(customPayloads)
	]);
	
	let html = '';
	allCategories.forEach(cat => {
		const hasDefault = defaultPayloads[cat] !== undefined;
		const isCustom = customPayloads[cat] !== undefined;
		const isDeleted = isCustom && customPayloads[cat]?._deleted;
		const isModified = isCustom && hasDefault && !isDeleted;
		const isNew = isCustom && !hasDefault;
		
		// Count payloads
		let payloadCount = 0;
		if (isCustom && !isDeleted) {
			payloadCount = (customPayloads[cat].payloads?.length || 0) + (customPayloads[cat].falsePayloads?.length || 0);
		} else if (hasDefault && !isDeleted) {
			payloadCount = (defaultPayloads[cat].payloads?.length || 0) + (defaultPayloads[cat].falsePayloads?.length || 0);
		}
		
		let badge = '';
		if (isDeleted) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-danger/20 text-cyber-danger rounded">DEL</span>';
		} else if (isNew) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-success/20 text-cyber-success rounded">NEW</span>';
		} else if (isModified) {
			badge = '<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-cyber-warning/20 text-cyber-warning rounded">MOD</span>';
		} else {
			badge = `<span class="ml-auto px-1.5 py-0.5 text-[10px] bg-gray-600/50 text-gray-400 rounded">${payloadCount}</span>`;
		}
		
		const isActive = currentEditingCategory === cat;
		html += `
			<button type="button" onclick="selectCategory('${escapeHtml(cat)}')" 
					class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${isActive ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/50' : 'text-gray-300 hover:bg-cyber-elevated hover:text-white'}">
				<span class="truncate flex-1">${escapeHtml(cat)}</span>
				${badge}
			</button>
		`;
	});
	
	container.innerHTML = html;
}

// Show empty editor state
function showEditorEmpty() {
	currentEditingCategory = null;
	document.getElementById('configEditorEmpty').style.display = 'flex';
	document.getElementById('configEditor').style.display = 'none';
	// Mobile: go back to categories list
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.remove('config-editing');
}

// Switch between Attack and False Positive payload tabs
function switchPayloadTab(tab) {
	const tabAttack = document.getElementById('tabAttackPayloads');
	const tabFalse = document.getElementById('tabFalsePayloads');
	const panelAttack = document.getElementById('panelAttackPayloads');
	const panelFalse = document.getElementById('panelFalsePayloads');
	
	if (!tabAttack || !tabFalse || !panelAttack || !panelFalse) return;
	
	if (tab === 'attack') {
		tabAttack.classList.add('border-cyber-accent', 'text-cyber-accent');
		tabAttack.classList.remove('border-transparent', 'text-gray-400');
		tabFalse.classList.remove('border-blue-400', 'text-blue-400');
		tabFalse.classList.add('border-transparent', 'text-gray-400');
		panelAttack.style.display = 'flex';
		panelFalse.style.display = 'none';
	} else {
		tabFalse.classList.add('border-blue-400', 'text-blue-400');
		tabFalse.classList.remove('border-transparent', 'text-gray-400');
		tabAttack.classList.remove('border-cyber-accent', 'text-cyber-accent');
		tabAttack.classList.add('border-transparent', 'text-gray-400');
		panelAttack.style.display = 'none';
		panelFalse.style.display = 'flex';
	}
}

// Update payload counts in tabs
function updatePayloadCounts(attackCount, falseCount) {
	const attackCountEl = document.getElementById('attackPayloadCount');
	const falseCountEl = document.getElementById('falsePayloadCount');
	
	if (attackCountEl) attackCountEl.textContent = attackCount;
	if (falseCountEl) falseCountEl.textContent = falseCount;
}

// Select and edit a category
function selectCategory(categoryName, activeTab = 'attack') {
	currentEditingCategory = categoryName;
	
	document.getElementById('configEditorEmpty').style.display = 'none';
	document.getElementById('configEditor').style.display = 'flex';

	// Mobile: switch to editor screen
	const container = document.querySelector('#testConfigModal .modal-body > div');
	if (container) container.classList.add('config-editing');
	
	// Update category name input
	document.getElementById('configCategoryName').value = categoryName;
	
	// Update badge
	const badge = document.getElementById('configCategoryBadge');
	const resetBtn = document.getElementById('configResetBtn');
	const deleteBtn = document.getElementById('configDeleteBtn');
	
	const hasDefault = defaultPayloads[categoryName] !== undefined;
	const isCustom = customPayloads[categoryName] !== undefined;
	
	if (isCustom && customPayloads[categoryName]?._deleted) {
		badge.textContent = 'Deleted';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-danger/20 text-cyber-danger';
		resetBtn.style.display = '';
		deleteBtn.style.display = 'none';
	} else if (isCustom && hasDefault) {
		badge.textContent = 'Modified';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-warning/20 text-cyber-warning';
		resetBtn.style.display = '';
		deleteBtn.style.display = '';
	} else if (isCustom) {
		badge.textContent = 'Custom';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-success/20 text-cyber-success';
		resetBtn.style.display = 'none';
		deleteBtn.style.display = '';
	} else {
		badge.textContent = 'Default';
		badge.className = 'px-2 py-0.5 text-xs rounded-full bg-cyber-accent/20 text-cyber-accent';
		resetBtn.style.display = 'none';
		deleteBtn.style.display = '';
	}
	
	// Get payloads - prioritize custom, fallback to default
	let attackPayloads = [];
	let falsePayloads = [];
	
	if (isCustom) {
		// Use custom payloads if they exist
		attackPayloads = customPayloads[categoryName].payloads || [];
		falsePayloads = customPayloads[categoryName].falsePayloads || [];
	} else if (hasDefault) {
		// Use default payloads from server
		attackPayloads = defaultPayloads[categoryName].payloads || [];
		falsePayloads = defaultPayloads[categoryName].falsePayloads || [];
	}
	
	// All payloads are now editable
	renderPayloadList('configAttackPayloads', attackPayloads, 'attack', !isCustom);
	renderPayloadList('configFalsePayloads', falsePayloads, 'false', !isCustom);
	
	// Update payload counts in tabs
	updatePayloadCounts(attackPayloads.length, falsePayloads.length);
	
	// Switch to the specified tab (default: attack)
	switchPayloadTab(activeTab);
	
	// Update sidebar selection
	renderConfigCategoryList();
}

// Render payload list - all payloads are now editable
function renderPayloadList(containerId, payloads, type, isDefault = false) {
	const container = document.getElementById(containerId);
	if (!container) return;
	
	if (payloads.length === 0) {
		container.innerHTML = `
			<div class="text-center py-4 text-gray-500 text-sm">
				No ${type === 'attack' ? 'attack' : 'false positive'} payloads defined.
				<br><span class="text-xs">Click "+ Add Payload" to create one.</span>
			</div>
		`;
		return;
	}
	
	// Check if this category is modified (has custom payloads)
	const isModified = !isDefault;
	const borderClass = isModified ? 'border-cyber-warning/50' : 'border-cyber-accent/20';
	
	let html = '';
	
	payloads.forEach((payload, index) => {
		html += `
			<div class="flex items-center gap-2">
				<input type="text" value="${escapeHtml(payload)}" 
					   onfocus="enableEditMode('${type}', ${index})"
					   onchange="updatePayloadValue('${type}', ${index}, this.value)"
					   class="flex-1 bg-cyber-elevated border ${borderClass} rounded px-3 py-2 text-sm font-mono text-gray-100 focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/30 outline-none" />
				<button type="button" onclick="removePayload('${type}', ${index})" 
						class="shrink-0 p-2 text-cyber-danger/60 hover:text-cyber-danger hover:bg-cyber-danger/20 rounded transition-all" title="Remove payload">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
					</svg>
				</button>
			</div>
		`;
	});
	
	container.innerHTML = html;
}

// Enable edit mode when clicking on a default payload
function enableEditMode(type, index) {
	if (!currentEditingCategory) return;
	
	// If this is still showing default payloads, copy to custom first
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
		renderConfigCategoryList();
	}
}

// Initialize custom payloads from default if not exists
function initCustomFromDefault(categoryName) {
	if (customPayloads[categoryName]) return; // Already customized
	
	const defaultData = defaultPayloads[categoryName];
	customPayloads[categoryName] = {
		type: defaultData?.type || 'ParamCheck',
		payloads: defaultData?.payloads ? [...defaultData.payloads] : [],
		falsePayloads: defaultData?.falsePayloads ? [...defaultData.falsePayloads] : []
	};
}

// Add new payload
function addPayload(type) {
	if (!currentEditingCategory) return;
	
	// Initialize from default if this is a default category being customized
	initCustomFromDefault(currentEditingCategory);
	
	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (!customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key] = [];
	}
	
	customPayloads[currentEditingCategory][key].push('');
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Copy a default payload to custom list for editing
function copyPayloadToCustom(type, payload) {
	if (!currentEditingCategory) return;
	
	// Initialize from default
	initCustomFromDefault(currentEditingCategory);
	
	// The payload is already copied when we initialized from default
	// Just refresh the view to show editable state
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Update payload value
function updatePayloadValue(type, index, value) {
	if (!currentEditingCategory) return;
	
	// Copy to custom first if not already
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
		renderConfigCategoryList();
	}
	
	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key][index] = value;
	}
}

// Remove payload
function removePayload(type, index) {
	if (!currentEditingCategory) return;
	
	// Copy to custom first if not already
	if (!customPayloads[currentEditingCategory]) {
		initCustomFromDefault(currentEditingCategory);
	}
	
	const key = type === 'attack' ? 'payloads' : 'falsePayloads';
	if (customPayloads[currentEditingCategory][key]) {
		customPayloads[currentEditingCategory][key].splice(index, 1);
		// Refresh the category but stay on the same tab
		selectCategory(currentEditingCategory, type);
		updateCustomCount();
	}
}

// Add new category
function addNewCategory() {
	const name = prompt('Enter new category name:');
	if (!name || name.trim() === '') return;
	
	const trimmedName = name.trim();
	
	// Check if category already exists
	if (defaultPayloads[trimmedName] || customPayloads[trimmedName]) {
		showAlert('A category with this name already exists.', 'Error', 'error');
		return;
	}
	
	customPayloads[trimmedName] = {
		type: 'ParamCheck',
		payloads: [],
		falsePayloads: []
	};
	
	renderConfigCategoryList();
	selectCategory(trimmedName);
	updateCustomCount();
}

// Delete category (works for all categories)
async function deleteCategory() {
	if (!currentEditingCategory) return;
	
	const hasDefault = defaultPayloads[currentEditingCategory] !== undefined;
	
	if (hasDefault) {
		const confirmed = await showConfirm(`Delete "${currentEditingCategory}"?\n\nThis will hide this default category from tests. You can restore it by resetting all payloads.`, 'Delete Category', 'danger');
		if (!confirmed) return;
		// Mark as deleted by setting empty payloads
		customPayloads[currentEditingCategory] = {
			type: defaultPayloads[currentEditingCategory]?.type || 'ParamCheck',
			payloads: [],
			falsePayloads: [],
			_deleted: true
		};
	} else {
		const confirmed = await showConfirm(`Are you sure you want to delete "${currentEditingCategory}"?`, 'Delete Category', 'danger');
		if (!confirmed) return;
		delete customPayloads[currentEditingCategory];
	}
	
	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
}

// Reset category to default
async function resetCategoryToDefault() {
	if (!currentEditingCategory) return;
	
	const confirmed = await showConfirm(`Reset "${currentEditingCategory}" to default payloads?`, 'Reset Category', 'warning');
	if (!confirmed) return;
	
	delete customPayloads[currentEditingCategory];
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
	renderConfigCategoryList();
	selectCategory(currentEditingCategory);
	updateCustomCount();
}

// Reset ALL payloads to defaults
async function resetAllPayloads() {
	const confirmed = await showConfirm('Reset ALL payloads to defaults?\n\nThis will remove all your customizations, modifications, and custom categories.', 'Reset All Payloads', 'danger');
	if (!confirmed) return;
	
	customPayloads = {};
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
	renderConfigCategoryList();
	showEditorEmpty();
	updateCustomCount();
	showAlert('All payloads have been reset to defaults.', 'Success', 'success');
}

// Update custom payload count
function updateCustomCount() {
	const countEl = document.getElementById('configCustomCount');
	if (!countEl) return;
	
	let total = 0;
	Object.values(customPayloads).forEach(cat => {
		total += (cat.payloads?.length || 0) + (cat.falsePayloads?.length || 0);
	});
	
	countEl.textContent = total;
}

// Save test configuration
function saveTestConfig() {
	// Update category name if changed
	if (currentEditingCategory) {
		const newName = document.getElementById('configCategoryName').value.trim();
		if (newName && newName !== currentEditingCategory && customPayloads[currentEditingCategory]) {
			customPayloads[newName] = customPayloads[currentEditingCategory];
			delete customPayloads[currentEditingCategory];
			currentEditingCategory = newName;
		}
	}
	
	// Clean up empty payloads
	Object.keys(customPayloads).forEach(cat => {
		if (customPayloads[cat].payloads) {
			customPayloads[cat].payloads = customPayloads[cat].payloads.filter(p => p.trim() !== '');
		}
		if (customPayloads[cat].falsePayloads) {
			customPayloads[cat].falsePayloads = customPayloads[cat].falsePayloads.filter(p => p.trim() !== '');
		}
		
		// Remove category if empty and not a modification
		if (!PAYLOAD_CATEGORIES.includes(cat) && 
			(!customPayloads[cat].payloads || customPayloads[cat].payloads.length === 0) &&
			(!customPayloads[cat].falsePayloads || customPayloads[cat].falsePayloads.length === 0)) {
			delete customPayloads[cat];
		}
	});
	
	// Save to localStorage
	localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
	
	// Update category checkboxes in main UI
	updateCategoryCheckboxesWithCustom();
	
	// Show success message
	showAlert('Configuration saved successfully!', 'Success', 'success');
	
	if (testConfigModal) {
		testConfigModal.hide();
	}
}

// Update category checkboxes to include custom categories
function updateCategoryCheckboxesWithCustom() {
	const container = document.getElementById('categoryCheckboxes');
	if (!container) return;
	
	// Get all categories (default + custom)
	const defaultCats = Object.keys(defaultPayloads);
	const allCategories = [...new Set([...PAYLOAD_CATEGORIES, ...defaultCats, ...Object.keys(customPayloads)])];
	
	container.innerHTML = '';
	const defaultChecked = ['SQL Injection', 'XSS'];
	
	allCategories.forEach((cat, idx) => {
		const id = 'cat_' + idx;
		const hasDefault = defaultPayloads[cat] !== undefined || PAYLOAD_CATEGORIES.includes(cat);
		const isCustom = customPayloads[cat] !== undefined && !hasDefault;
		const isModified = customPayloads[cat] !== undefined && hasDefault;
		
		let label = cat;
		if (isCustom) {
			label += ' <span class="text-cyber-success text-[10px]">(custom)</span>';
		} else if (isModified) {
			label += ' <span class="text-cyber-warning text-[10px]">(mod)</span>';
		}
		
		const div = document.createElement('div');
		div.className = 'form-check';
		div.innerHTML = `<input class="form-check-input" type="checkbox" value="${cat}" id="${id}"${defaultChecked.includes(cat) ? ' checked' : ''}>
      <label class="form-check-label" for="${id}">${label}</label>`;
		container.appendChild(div);
	});
}

// Export custom payloads
function exportCustomPayloads() {
	// Export ALL payloads (defaults merged with customs)
	const allPayloads = {};
	
	// Start with all default payloads
	for (const [cat, data] of Object.entries(defaultPayloads)) {
		allPayloads[cat] = {
			type: data.type || 'ParamCheck',
			payloads: [...(data.payloads || [])],
			falsePayloads: [...(data.falsePayloads || [])]
		};
	}
	
	// Override with custom payloads (including deleted ones)
	for (const [cat, data] of Object.entries(customPayloads)) {
		if (data._deleted) {
			// Category was deleted - mark it
			allPayloads[cat] = { ...data };
		} else {
			allPayloads[cat] = {
				type: data.type || 'ParamCheck',
				payloads: [...(data.payloads || [])],
				falsePayloads: [...(data.falsePayloads || [])]
			};
		}
	}
	
	const exportData = {
		version: '2.0',
		exportedAt: new Date().toISOString(),
		payloads: allPayloads
	};
	
	// Convert to YAML
	const yamlStr = jsyaml.dump(exportData, {
		indent: 2,
		lineWidth: -1,
		quotingType: '"',
		forceQuotes: false,
		skipInvalid: false
	});
	
	const blob = new Blob([yamlStr], { type: 'text/yaml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'waf-checker-payloads.yaml';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Import custom payloads
function importCustomPayloads() {
	document.getElementById('importPayloadsInput').click();
}

// Handle file import
function handlePayloadsImport(event) {
	const file = event.target.files[0];
	if (!file) return;
	
	const reader = new FileReader();
	reader.onload = async function(e) {
		try {
			const fileContent = e.target.result;
			const fileName = file.name.toLowerCase();
			let imported;
			
			// Detect format and parse accordingly
			if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
				// Parse YAML
				if (typeof jsyaml === 'undefined') {
					throw new Error('YAML parser not loaded. Please refresh the page.');
				}
				imported = jsyaml.load(fileContent);
			} else if (fileName.endsWith('.json')) {
				// Parse JSON (backward compatibility)
				imported = JSON.parse(fileContent);
			} else {
				// Try to auto-detect: if it starts with { or [, it's JSON, otherwise try YAML
				const trimmed = fileContent.trim();
				if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
					imported = JSON.parse(fileContent);
				} else {
					if (typeof jsyaml === 'undefined') {
						throw new Error('YAML parser not loaded. Please refresh the page.');
					}
					imported = jsyaml.load(fileContent);
				}
			}
			
			// Validate structure
			if (typeof imported !== 'object' || imported === null) {
				throw new Error('Invalid format: expected an object');
			}
			
			// Handle new format (v2.0) with wrapper
			let payloadsData = imported;
			if (imported.version && imported.payloads) {
				payloadsData = imported.payloads;
			}
			
			// Ask user what to do
			const replaceAll = await showConfirm('Replace all payloads?\n\nOK = Replace all (recommended)\nCancel = Merge with existing', 'Import Mode');
			
			if (replaceAll) {
				// Replace mode - clear all custom payloads and import
				customPayloads = {};
			}
			
			// Import payloads
			Object.keys(payloadsData).forEach(cat => {
				const data = payloadsData[cat];
				if (data.payloads !== undefined || data.falsePayloads !== undefined) {
					// Check if this differs from default
					const defaultData = defaultPayloads[cat];
					const isDifferentFromDefault = !defaultData || 
						JSON.stringify(data.payloads) !== JSON.stringify(defaultData.payloads) ||
						JSON.stringify(data.falsePayloads) !== JSON.stringify(defaultData.falsePayloads) ||
						data._deleted;
					
					if (isDifferentFromDefault) {
						customPayloads[cat] = {
							type: data.type || 'ParamCheck',
							payloads: data.payloads || [],
							falsePayloads: data.falsePayloads || [],
							...(data._deleted ? { _deleted: true } : {})
						};
					}
				}
			});
			
			localStorage.setItem('wafchecker_customPayloads', JSON.stringify(customPayloads));
			renderConfigCategoryList();
			updateCustomCount();
			showEditorEmpty();
			showAlert('Payloads imported successfully!', 'Success', 'success');
		} catch (err) {
			showAlert('Failed to import: Invalid format\n' + err.message, 'Error', 'error');
		}
	};
	reader.readAsText(file);
	
	// Reset input
	event.target.value = '';
}

// Override renderCategoryCheckboxes to include custom categories
const originalRenderCategoryCheckboxes = renderCategoryCheckboxes;
renderCategoryCheckboxes = function() {
	initCustomPayloads();
	updateCategoryCheckboxesWithCustom();
};
