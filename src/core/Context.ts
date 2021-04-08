import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'querystring';
import { Stream } from 'stream';
import { HttpStatus } from '../def/Constant';
import { Route } from '../def/Route';

/**
 * 应用上下文
 */
export class Context {

    private request: IncomingMessage;
    private response: ServerResponse;
    private route?: Route;

    private queries: any = {}; // 查询字符串参数
    private parameters: any = {}; // 路由路径参数
    private attributes: any = {}; // 自定义属性

    public constructor(request: IncomingMessage, response: ServerResponse) {
        this.request = request;
        this.response = response;
    }

    public getRequest() {
        return this.request;
    }

    public getResponse() {
        return this.response;
    }

    public getRoute() {
        return this.route;
    }

    public setRoute(route: Route) {
        this.route = route;
        this.setParameters(route.params);
        this.setQueries(route.queries);
    }

    /** ---------------------------------------------------
     * 请求扩展
     * ---------------------------------------------------*/

    /**
     * 设置请求参数
     * @param params 
     */
    public setParameters(params: {}) {
        this.parameters = params;
    }

    /**
     * 获取请求参数
     * @param key 
     * @returns 
     */
    public getParameter(key: string) {
        return this.parameters[key];
    }

    /**
     * 获取所有请求参数
     * @returns 
     */
    public getParameters() {
        return this.parameters;
    }

    /**
     * 设置查询参数
     * @param query 
     */
    public setQueries(queries: {}) {
        this.queries = queries;
    }

    /**
     * 获取查询参数
     * @param key 
     * @returns 
     */
    public getQuery(key: string) {
        return this.queries[key];
    }

    /**
     * 获取所有查询参数
     * @returns 
     */
    public getQueries() {
        return this.queries;
    }

    /**
     * 设置自定义属性
     * @param key 
     * @param value 
     */
    public setAttribute(key: string, value: any) {
        this.attributes[key] = value;
    }

    /**
     * 获取自定义属性
     * @param key 
     * @returns 
     */
    public getAttribute(key: string) {
        return this.attributes[key];
    }

    /**
     * 获取所有自定义属性
     * @returns 
     */
    public getAttributes() {
        return this.attributes;
    }

    /**
     * 获取请求方法
     * @returns 
     */
    public getMethod() {
        return this.request.method;
    }

    /**
     * 获取请求路径
     * @returns 
     */
    public getUrl() {
        return this.request.url;
    }

    /**
     * 获取所有请求头
     * @returns 
     */
    public getHeaders() {
        return this.request.headers;
    }

    /**
     * 获取指定请求头
     * @param key 
     * @returns 
     */
    public getHeader(key: string) {
        return this.request.headers[key];
    }

    /**
     * 获取请求体
     * @returns 
     */
    public getBody() {
        return this.parseRawBody();
    }

    /**
     * 获取 Cookies
     * @returns 
     */
    public getCookies() {
        const cookies: any = {};
        let cookie = this.getHeader('cookie') as string;
        if (cookie) {
            cookie.split(/;\s+/).forEach(c => {
                const i = c.indexOf('=');
                const k = c.substr(0, i);
                const v = c.substr(i + 1);
                cookies[k] = v;
            })
        }
        return cookies;
    }

    /**
     * 内部跳转到另一个路由
     * @param url 
     * @param attrs 
     */
    public forward(url: string, attrs?: any) {
        if (this.request.url !== url) {
            this.request.url = url;

            // 附加属性
            if (attrs) Object.getOwnPropertyNames(attrs).forEach(key => {
                this.setAttribute(key, attrs[key]);
            })
        }
    }

    /** ---------------------------------------------------
     * 响应扩展
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
        if (typeof data === 'string' || Buffer.isBuffer(data)) {
            return this.response.end(data);
        }
        // 其余类型数据 Json 序列化输出
        this.setHeader('Content-Type', 'application/json; charset=utf-8')
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
                const contentType = this.getHeader('content-type');

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