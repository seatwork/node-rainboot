import { Middleware, TemplateEngine } from '../def/Plugin';
import { Route } from '../def/Route';

/**
 * 公共容器（单例）
 */
export class Container {

    private middlewares: Middleware[] = []; // 中间件容器
    private routes: Route[] = []; // 路由容器
    private templateEngine?: TemplateEngine; // 模板引擎

    /**
     * 私有构造方法
     */
    private static singleton: Container;
    private constructor() { }

    /**
     * 代替构造方法
     * @returns 
     */
    public static getInstance() {
        if (!Container.singleton) {
            Container.singleton = new Container();
        }
        return Container.singleton;
    }

    /**
     * 添加中间件
     * @param middleware 
     */
    public addMiddleware(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * 获取中间件
     * @returns 
     */
    public getMiddlewares() {
        return this.middlewares;
    }

    /**
     * 添加路由
     * @param route 
     */
    public addRoute(route: Route) {
        this.routes.push(route);
    }

    /**
     * 获取路由
     * @returns 
     */
    public getRoutes() {
        return this.routes;
    }

    /**
     * 设置模板引擎
     * @param engine 
     */
    public setTemplateEngine(engine: TemplateEngine) {
        this.templateEngine = engine;
    }

    /**
     * 获取模板引擎
     * @returns 
     */
    public getTemplateEngine() {
        return this.templateEngine;
    }

}