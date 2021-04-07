import Http from 'http';
import { parse } from 'querystring';

/**
 * Http.IncomingMessage 封装
 */
export class HttpRequest {

    private request;
    private parameters: any = {}; // 路由路径附带的参数
    private queries: any = {}; // 查询字符串参数
    private attributes: any = {}; // 自定义属性

    public constructor(request: Http.IncomingMessage) {
        this.request = request;
    }

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
     * 获取请求头
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
     * 内部跳转执行另一个路由
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