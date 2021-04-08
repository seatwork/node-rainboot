import { Route } from "../def/Route";

/**
 * 路由管理
 */
export class Router {

    private static readonly PATH_REGEX: string = '[a-zA-Z0-9_@\\-\\.]+';
    private routes: Route[] = []; // 路由容器

    /**
     * 创建单例
     */
    private static singleton: Router;
    private constructor() { }

    public static getInstance() {
        if (!Router.singleton) {
            Router.singleton = new Router();
        }
        return Router.singleton;
    }

    /**
     * 添加路由
     * @param route 
     */
    public addRoute(route: Route) {
        this.routes.push(route);
    }

    /**
     * 查找路由
     * @param method 请求方法
     * @param path 请求路径
     * @returns 
     */
    public findRoute(method: string, path: string) {
        for (let route of this.routes) {
            if (!route.path) continue;
            if (route.method !== method) continue;

            // 匹配路径中的正则表达式
            const url = new URL(path, 'http://localhost');
            const pattern = route.path.replace(new RegExp(':(' + Router.PATH_REGEX + ')', 'g'), '(?<$1>' + Router.PATH_REGEX + ')')
            const result = url.pathname.match('^' + pattern + '$')
            const params = result ? result.groups || Array.from(result).slice(1) : null

            if (params) {
                route.params = params;
                route.queries = url.searchParams;
                return route;
            }
        }
    }

}