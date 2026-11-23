/* ==========================================================================
   ordpf 管理端统一请求封装
   1) Nginx /api/ -> Gateway /admin/
   2) 自动携带 zmlhsc 员工令牌
   3) 兼容 R{code,msg,data} 与裸返回
   ========================================================================== */
(function (global) {
    'use strict';

    var TOKEN_KEY = 'ordpf.admin.token';
    var USER_KEY = 'ordpf.admin.user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function setAuth(vo) {
        localStorage.setItem(TOKEN_KEY, vo.token || '');
        localStorage.setItem(USER_KEY, JSON.stringify({
            id: vo.id,
            name: vo.name || vo.userName || '管理员',
            userName: vo.userName
        }));
    }

    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function isLogin() {
        return !!getToken();
    }

    function buildUrl(path, params) {
        var url = '/api' + path;
        if (!params) return url;
        var qs = new URLSearchParams();
        Object.keys(params).forEach(function (k) {
            var v = params[k];
            if (v === undefined || v === null || v === '') return;
            qs.append(k, v);
        });
        var s = qs.toString();
        return s ? url + '?' + s : url;
    }

    function extractMsg(text) {
        if (!text) return '';
        try {
            var j = JSON.parse(text);
            return j.msg || j.message || j.error || '';
        } catch (e) {
            return text.length > 120 ? text.slice(0, 120) : text;
        }
    }

    async function request(method, path, options) {
        options = options || {};
        var headers = {};
        var token = getToken();
        if (token) headers['zmlhsc'] = token;

        var init = { method: method, headers: headers };
        if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }

        var resp;
        try {
            resp = await fetch(buildUrl(path, options.params), init);
        } catch (e) {
            throw new Error('无法连接后端：请确认 Nginx 与 gateway(8080) 已启动');
        }

        if (resp.status === 401) {
            clearAuth();
            throw new Error('登录已过期，请重新登录');
        }
        if (resp.status === 502 || resp.status === 503 || resp.status === 504) {
            throw new Error('服务暂时不可用（HTTP ' + resp.status + '）：请确认 Nacos 与目标服务已启动');
        }

        var text = await resp.text();
        if (!resp.ok) {
            throw new Error(extractMsg(text) || ('请求失败 HTTP ' + resp.status));
        }
        if (!text) return null;

        var json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return text;
        }

        if (json && typeof json === 'object' && !Array.isArray(json) &&
            Object.prototype.hasOwnProperty.call(json, 'code')) {
            if (json.code === 200) return json.data;
            throw new Error(json.msg || '请求失败');
        }
        return json;
    }

    async function download(path, params, filename) {
        var headers = {};
        var token = getToken();
        if (token) headers['zmlhsc'] = token;

        var resp = await fetch(buildUrl(path, params), { headers: headers });
        if (resp.status === 401) {
            clearAuth();
            throw new Error('登录已过期，请重新登录');
        }
        if (!resp.ok) {
            var text = await resp.text();
            throw new Error(extractMsg(text) || ('导出失败 HTTP ' + resp.status));
        }
        var blob = await resp.blob();
        var a = document.createElement('a');
        var href = URL.createObjectURL(blob);
        a.href = href;
        a.download = filename || 'export.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
    }

    global.api = {
        get: function (path, params) { return request('GET', path, { params: params }); },
        post: function (path, body, params) { return request('POST', path, { body: body, params: params }); },
        put: function (path, body, params) { return request('PUT', path, { body: body, params: params }); },
        del: function (path, params) { return request('DELETE', path, { params: params }); },
        download: download,
        auth: {
            getToken: getToken,
            getUser: getUser,
            setAuth: setAuth,
            clearAuth: clearAuth,
            isLogin: isLogin
        }
    };
})(window);
