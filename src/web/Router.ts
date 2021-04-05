import { Route } from "./Route";

/**
 * 路由缓存及查找
 */
export class Router {

    private static readonly PATH_REGEX: string = '[a-zA-Z0-9_@\\-\\.]+';
    private static readonly routes: Route[] = [];

    /**
     * 添加路由
     * @param route 
     */
    static addRoute(route: Route) {
        Router.routes.push(route);
    }

    /**
     * 获取所有路由
     * @returns 
     */
    static getRoutes() {
        return Router.routes;
    }

    /**
     * 查找路由
     * @param method 请求方法
     * @param url 请求路径
     * @returns 
     */
    static findRoute(method: string | undefined, url: string | undefined): Route | undefined {
        if (!method || !url) return

        for (let route of Router.routes) {
            if (route.method === method) {

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

}