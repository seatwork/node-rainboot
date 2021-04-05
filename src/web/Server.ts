import Http from 'http';
import { url, version } from '../../package.json';
import { PARAM_REQUEST, PARAM_RESPONSE, REQUEST_FIELD_BODY, REQUEST_FIELD_HEADERS, REQUEST_FIELD_PARAM, REQUEST_FIELD_QUERY } from '../Constant';
import { HttpRequest } from '../http/HttpRequest';
import { HttpResponse } from '../http/HttpResponse';
import { HttpStatus } from '../http/HttpStatus';
import { Route } from './Route';
import { Router } from './Router';

/**
 * 应用服务器
 */
export class Server {
    private server: Http.Server;

    /**
     * 创建应用服务器
     */
    constructor() {
        this.server = Http.createServer((req, res) => this.handleRequest(req, res));
    }

    /**
     * 启动应用服务器
     * @param port 
     */
    run(port: number) {
        this.server.listen(port, () => {
            console.log(`\x1b[90mMicro-spark ^${version} - ${url}\x1b[0m`)
            console.log(`> \x1b[32mReady!\x1b[0m Running at \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`)
        })
    }

    /**
     * 请求处理入口
     * @param request 
     * @param response 
     * @returns 
     */
    private async handleRequest(req: Http.IncomingMessage, res: Http.ServerResponse) {
        // 封装请求和响应
        const request = new HttpRequest(req);
        const response = new HttpResponse(res);

        try {
            // 查找路由（未找到则返回404状态）
            const route = Router.findRoute(request.getMethod(), request.getUrl());
            if (!route) {
                response.send('Route not found: ' + request.getUrl(), HttpStatus.NOT_FOUND);
                return;
            }

            // 执行路由控制器方法
            const proxyHandle = this.createProxyHandle(request, response, route);
            let result = await proxyHandle();

            // 如果已经在控制器中发送响应不作处理
            if (response.isHeadersSent()) {
                return;
            }

            // 如果没有返回值返回204状态
            if (result === undefined) {
                response.send(result, HttpStatus.NO_CONTENT);
            } else {
                response.send(result);
            }
        } catch (e) {
            console.error('\x1b[31m[ERROR]\x1b[0m', request.getMethod(), request.getUrl(), e.stack || e)
            response.send(e.message || e.stack || e, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 解析参数装饰器并代理控制器方法
     * @param request 
     * @param response 
     * @param route 
     * @returns 
     */
    private createProxyHandle(request: HttpRequest, response: HttpResponse, route: Route) {
        const handler = route.controller[route.handle]

        // 返回代理后的方法
        return async () => {
            const args = Array.from(arguments);

            // 遍历带有装饰器的参数重新赋值
            for (let arg of route.arguments) {
                switch (arg.type) {
                    case PARAM_REQUEST: args[arg.index] = await this.getRequest(request, route, arg.field); break;
                    case PARAM_RESPONSE: args[arg.index] = response; break;
                    default: break;
                }
            }
            return await handler.apply(route.controller, args);
        }
    }

    /**
     * 根据参数装饰器的field获取对应数据
     * @param request 
     * @param route 
     * @param field 
     * @returns 
     */
    private async getRequest(request: HttpRequest, route: Route, field: string) {
        if (!field) return request;

        switch (field.toUpperCase()) {
            case REQUEST_FIELD_HEADERS: return request.getHeaders();
            case REQUEST_FIELD_BODY: return await request.getRawBody();
            case REQUEST_FIELD_PARAM: return route.param;
            case REQUEST_FIELD_QUERY: return route.query;
            default: return request;
        }
    }

}