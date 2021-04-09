import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'querystring';
import { Stream } from 'stream';
import { HttpStatus } from '../def/Constant';
import { HttpError } from '../def/HttpError';
import { Route } from '../def/Route';

/**
 * 应用上下文
 */
export class Context {

    private request: IncomingMessage;
    private response: ServerResponse;

    private _route?: Route;     // 路由对象
    private _params: any = {};  // 路由路径参数
    private _query: any = {};   // 查询字符串参数
    private _error?: HttpError;     // 错误对象

    /**
     * 构造方法
     * @param request 
     * @param response 
     */
    public constructor(request: IncomingMessage, response: ServerResponse) {
        this.request = request;
        this.response = response;
    }

    /** ---------------------------------------------------
     * 扩展请求方法
     * ---------------------------------------------------*/

    public get route() { return this._route; }
    public get params() { return this._params; }
    public get query() { return this._query; }
    public get method() { return this.request.method; }
    public get url() { return this.request.url; }
    public get headers() { return this.request.headers; }
    public get body() { return this.parseRawBody(); }
    public get error() { return this._error; }

    /**
     * 设置路由参数
     * @param route 
     */
    public setRoute(route: Route) {
        this._route = route;
        this._params = route.params;
        this._query = route.query;
        delete route.params;
        delete route.query;
    }

    /**
     * 设置错误
     * @param error 
     */
    public setError(error: HttpError) {
        this._error = error;
    }

    /**
     * 获取 Cookies
     */
    public get cookies() {
        const _cookies: any = {};
        let cookie = this.headers.cookie;
        if (cookie) {
            cookie.split(/;\s+/).forEach(c => {
                const i = c.indexOf('=');
                const k = c.substr(0, i);
                const v = c.substr(i + 1);
                _cookies[k] = v;
            })
        }
        return _cookies;
    }

    /**
     * 内部跳转到另一个路由
     * @param url 
     * @param attrs 
     */
    public forward(url: string) {
        this.request.url = url;
    }

    /** ---------------------------------------------------
     * 扩展响应方法
     * ---------------------------------------------------*/

    /**
     * 发送响应
     * @param data 响应内容
     * @param status 响应状态码（默认200）
     */
    public send(data: any, status?: number) {
        // 如果状态码超出范围
        this.response.statusCode = (!status || status < 200 || status > 511)
            ? HttpStatus.SUCCESS : status;

        // 如果已经发送响应不作任何处理
        if (this.isHeadersSent()) {
            return;
        }
        // 如果是空数据
        if (data === undefined || data === null) {
            return this.response.end();
        }
        // 如果是数据流通过管道输出
        if (data instanceof Stream) {
            return data.pipe(this.response);
        }
        // 标准响应仅支持 String/Buffer 类型
        if (typeof data === 'string') {
            this.setHeader('Content-Type', 'text/plain;charset=utf-8');
            return this.response.end(data);
        }
        if (Buffer.isBuffer(data)) {
            return this.response.end(data);
        }
        // 其余类型数据 Json 序列化输出
        this.setHeader('Content-Type', 'application/json;charset=utf-8')
        this.response.end(JSON.stringify(data));
    }

    /**
     * 是否已发送响应头
     * @returns
     */
    public isHeadersSent(): boolean {
        return this.response.headersSent;
    }

    /**
     * 设置响应头
     * @param key
     * @param value
     */
    public setHeader(key: string, value: string) {
        this.response.setHeader(key, value);
    }

    /**
     * 设置 Cookie
     * @param key
     * @param value
     * @param options
     */
    public setCookie(key: string, value: string, options: any = {}) {
        const cookies = [`${key}=${value}`];
        if (options.domain) {
            cookies.push(`domain=${options.domain}`)
        }
        if (options.maxAge) {
            cookies.push(`max-age=${options.maxAge}`)
        }
        if (options.httpOnly) {
            cookies.push(`httpOnly=true`)
        }
        this.setHeader('Set-Cookie', cookies.join('; '));
    }

    /**
     * 重定向（302，303，307为临时重定向，301，308为永久重定向，默认301）
     * @param url
     * @param status
     */
    public redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 301) {
        this.response.writeHead(status, { Location: url });
        this.response.end();
    }

    /** ---------------------------------------------------
     * 私有方法
     * ---------------------------------------------------*/

    /**
     * 解析请求体
     * @returns 
     */
    private parseRawBody() {
        return new Promise((resolve, reject) => {
            const buffer: Uint8Array[] = [];
            this.request.on('data', chunk => {
                buffer.push(chunk);
            });
            this.request.on('error', err => {
                reject(err);
            });
            this.request.on('end', () => {
                let data: any = Buffer.concat(buffer).toString('utf8');
                const contentType = this.headers['content-type'];

                if (contentType) {
                    if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
                        data = parse(data);
                    } else if (contentType.indexOf('application/json') >= 0) {
                        data = this.tryParseJson(data);
                    }
                }
                resolve(data);
            });
        });
    }

    /**
     * 尝试解析Json字符串（解析错误时返回原始内容）
     * @param data 
     * @returns 
     */
    private tryParseJson(data: string) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }

}