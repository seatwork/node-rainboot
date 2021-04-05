import Http from 'http';
import { HttpStatus } from './HttpStatus';

/**
 * Http.ServerResponse 封装
 */
export class HttpResponse {

    private response;

    constructor(response: Http.ServerResponse) {
        this.response = response;
    }

    /**
     * 发送响应
     * @param data 响应内容 
     * @param status 响应状态码（默认200）
     */
    send(data: any, status?: number) {
        // 标准响应内容仅支持 string/buffer 类型
        if (typeof data !== undefined && typeof data !== 'string' && !Buffer.isBuffer(data)) {
            data = JSON.stringify(data)
            this.response.setHeader('Content-Type', 'application/json; charset=utf-8')
        }

        // 状态码超出范围
        if (!status || status < 200 || status > 511) {
            status = HttpStatus.SUCCESS;
        }
        this.response.statusCode = status;
        this.response.end(data);
    }

    /**
     * 是否已发送响应头
     * @returns 
     */
    isHeadersSent(): boolean {
        return this.response.headersSent;
    }

    /**
     * 设置响应头
     * @param key 
     * @param value 
     */
    setHeader(key: string, value: string) {
        this.response.setHeader(key, value);
    }

    /**
     * 设置 Cookie
     * @param key 
     * @param value 
     * @param options 
     */
    setCookie(key: string, value: string, options: any = {}) {
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
    redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 301) {
        this.response.writeHead(status, { Location: url })
        this.response.end()
    }

}