import Http from 'http';
import { parse } from 'querystring';

/**
 * Http IncomingMessage 封装
 */
export class HttpRequest {

    private request;

    constructor(request: Http.IncomingMessage) {
        this.request = request;
    }

    /**
     * 获取请求方法
     * @returns 
     */
    getMethod() {
        return this.request.method;
    }

    /**
     * 获取请求路径
     * @returns 
     */
    getUrl() {
        return this.request.url;
    }

    /**
     * 获取请求头
     * @returns 
     */
    getHeaders() {
        return this.request.headers;
    }

    /**
     * 获取指定请求头
     * @param field 
     * @returns 
     */
    getHeader(field: string) {
        return this.request.headers[field];
    }

    /**
     * 获取请求体
     * @returns 
     */
    getRawBody() {
        return this.parseRawBody();
    }

    /**
     * 获取 Cookie
     * @returns 
     */
    getCookies() {
        const cookies: any = {};
        let cookie = this.getHeader('cookie') as string;
        if (cookie) {
            const cookieArray = cookie.split(/;\s+/)
            cookieArray.forEach(c => {
                const i = c.indexOf('=')
                const k = c.substr(0, i)
                const v = c.substr(i + 1)
                cookies[k] = v
            })
        }
        return cookies;
    }

    getSession() {

    }

    /**
     * 解析请求体
     * @returns 
     */
    private parseRawBody() {
        return new Promise((resolve, reject) => {
            const buffer: Uint8Array[] = []
            this.request.on('data', (chunk: Uint8Array) => {
                buffer.push(chunk)
            })
            this.request.on('error', err => {
                reject(err)
            })
            this.request.on('end', () => {
                let data: any = Buffer.concat(buffer).toString('utf8')
                const contentType = this.getHeader('content-type')

                if (contentType) {
                    if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
                        data = parse(data)
                    } else if (contentType.indexOf('application/json') >= 0) {
                        data = this.tryParseJson(data)
                    }
                }
                resolve(data)
            })
        })
    }

    /**
     * 尝试解析Json字符串（解析错误时返回原始内容）
     * @param data 
     * @returns 
     */
    private tryParseJson(data: string) {
        try {
            return JSON.parse(data)
        } catch (e) {
            return data
        }
    }

}