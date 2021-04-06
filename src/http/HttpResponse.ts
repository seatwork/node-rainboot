import fs from 'fs';
import Http from 'http';
import path from 'path';
import zlib from 'zlib';
import { MimeType } from '../def/MimeType';
import { HttpStatus } from './HttpStatus';

/**
 * Http.ServerResponse 封装
 */
export class HttpResponse {

    private response;

    public constructor(response: Http.ServerResponse) {
        this.response = response;
    }

    /**
     * 发送响应
     * @param data 响应内容 
     * @param status 响应状态码（默认200）
     */
    public send(data: any, status?: number) {
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
     * 输出静态资源流
     * @param url 资源路径
     * @param gzip 是否压缩
     */
    public pipe(url: string, gzip: boolean) {
        const filename = path.join(process.cwd(), url);
        const extname = path.extname(filename).substr(1).toUpperCase();

        // 资源不存在
        if (!fs.existsSync(filename)) {
            this.send('File not found: ' + url, HttpStatus.NOT_FOUND);
            return
        }

        // 资源并非文件类型
        const stat = fs.statSync(filename)
        if (!stat.isFile()) {
            this.send('File not acceptable: ' + url, HttpStatus.NOT_ACCEPTABLE);
            return
        }

        // 设置响应头
        this.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        this.setHeader('Last-Modified', new Date(stat.mtime).toUTCString());
        if (MimeType[extname]) this.setHeader('Content-Type', MimeType[extname]);

        // 读取文件通过管道输出
        const stream = fs.createReadStream(filename)
        if (gzip) {
            this.setHeader('Content-Encoding', 'gzip')
            stream.pipe(zlib.createGzip()).pipe(this.response);
        } else {
            stream.pipe(this.response)
        }
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
        this.response.writeHead(status, { Location: url })
        this.response.end()
    }

}