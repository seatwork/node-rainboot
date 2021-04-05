import { PARAM_REQUEST, PARAM_RESPONSE, REQUEST_FIELD_BODY, REQUEST_FIELD_COOKIES, REQUEST_FIELD_HEADERS, REQUEST_FIELD_METHOD, REQUEST_FIELD_PARAM, REQUEST_FIELD_QUERY, REQUEST_FIELD_URL } from "../core/Constant";
import { Container } from "../core/Container";
import { HttpRequest } from "../http/HttpRequest";
import { HttpResponse } from "../http/HttpResponse";
import { Route } from "./Route";

/**
 * 路由管理
 */
export class Router {

    private static readonly PATH_REGEX: string = '[a-zA-Z0-9_@\\-\\.]+';
    private container = Container.getInstance();
    private request: HttpRequest;
    private response: HttpResponse;
    private route?: Route;

    /**
     * 初始化数据
     * @param request 
     * @param response 
     */
    public constructor(request: HttpRequest, response: HttpResponse) {
        this.request = request;
        this.response = response;
        this.route = this.findRoute();
    }

    /**
     * 获取路由
     * @returns 
     */
    public getRoute() {
        return this.route;
    }

    /**
     * 代理执行路由控制器方法
     * @returns 
     */
    public async execute() {
        const proxyHandle = this.createProxyHandle();
        return await proxyHandle();
    }

    /**
     * 解析参数装饰器并代理控制器方法
     * @returns 
     */
    private createProxyHandle() {
        // 返回代理后的方法
        return async () => {
            if (!this.route) throw new Error('Route not found.');
            if (!this.route.handle) throw new Error('No method available in controller.');
            const args = Array.from(arguments);

            // 遍历带有装饰器的参数重新赋值
            if (this.route.arguments) {
                for (let arg of this.route.arguments) {
                    switch (arg.type) {
                        case PARAM_REQUEST: args[arg.index] = await this.getArgument(arg.field); break;
                        case PARAM_RESPONSE: args[arg.index] = this.response; break;
                        default: break;
                    }
                }
            }

            // 用新参数执行控制器方法
            const handle = this.route.controller[this.route.handle]
            return await handle.apply(this.route.controller, args);
        }
    }

    /**
     * 根据参数装饰器的 field 获取对应数据
     * @param field 
     * @returns 
     */
    private async getArgument(field: string) {
        if (!field) return this.request;
        if (!this.route) throw new Error('Route not found.');

        switch (field.toUpperCase()) {
            case REQUEST_FIELD_METHOD: return this.request.getMethod();
            case REQUEST_FIELD_URL: return this.request.getUrl();
            case REQUEST_FIELD_HEADERS: return this.request.getHeaders();
            case REQUEST_FIELD_COOKIES: return this.request.getCookies();
            case REQUEST_FIELD_BODY: return await this.request.getBody();
            case REQUEST_FIELD_PARAM: return this.route.param;
            case REQUEST_FIELD_QUERY: return this.route.query;
            default: return this.request;
        }
    }

    /**
     * 查找路由
     * @param method 请求方法
     * @param url 请求路径
     * @returns 
     */
    private findRoute() {
        const method = this.request.getMethod();
        const url = this.request.getUrl();
        if (!method || !url) return

        const routes = this.container.getRoutes();
        for (let route of routes) {
            if (!route.path) continue;
            if (route.method !== method) continue;

            // 匹配路径中的正则表达式
            const parsedUrl = new URL(url, 'http://localhost');
            const pattern = route.path.replace(new RegExp(':(' + Router.PATH_REGEX + ')', 'g'), '(?<$1>' + Router.PATH_REGEX + ')')
            const result = parsedUrl.pathname.match('^' + pattern + '$')
            const param = result ? result.groups || Array.from(result).slice(1) : null

            if (param) {
                route.param = param;
                route.query = parsedUrl.searchParams;
                return route;
            }
        }
    }

}