import path from "path";
import 'reflect-metadata';
import { Metadata, Method } from "../def/Constant";
import { Route } from "../def/Route";
import { Router } from "./Router";

const router = Router.getInstance();

/**
 * 创建请求方法装饰器
 * @param method 请求方法名
 * @returns 
 */
const createMethodDecorator = (method: string) => (path: string = ''): MethodDecorator => {
    return (target, name) => {
        // 获取类元数据
        const routes = Reflect.getMetadata(Metadata.ROUTES, target.constructor) as Array<Route> || [];

        // 由于同一个方法上可能存在多个装饰器（如 @Get 和 @Template），在使用时可能并不按照优先级放置，
        // 所以每个装饰器执行时都需要先查找是否已经存在，存在则在原对象上附加属性，不存在则直接添加新对象。
        const route = routes.find(v => v.handle === name);
        if (route) Object.assign(route, { method, path, handle: name as string })
        else routes.push({ method, path, handle: name as string });

        // 将元数据重新绑定到所在类
        Reflect.defineMetadata(Metadata.ROUTES, routes, target.constructor);
    };
}

/**
 * 创建模板装饰器
 * @param path 
 * @returns 
 */
export const Template = (path: string): MethodDecorator => {
    return (target, name) => {
        const routes = Reflect.getMetadata(Metadata.ROUTES, target.constructor) as Array<Route> || [];
        const route = routes.find(v => v.handle === name);

        if (route) route.template = path;
        else routes.push({ handle: name as string, template: path });
        Reflect.defineMetadata(Metadata.ROUTES, routes, target.constructor);
    };
}

/**
 * 导出控制器装饰器
 * @param prefix 路由前缀
 * @returns 
 */
export const Controller = (prefix: string = ''): ClassDecorator => {
    return (constructor: any) => {
        // 获取方法装饰器触发时绑定的路由元数据
        const routes: Route[] = Reflect.getMetadata(Metadata.ROUTES, constructor);
        const controller = new constructor();

        // 将所有路由添加到缓存
        for (let route of routes) {
            if (route.path === undefined) continue;
            route.controller = controller; // 添加控制器实例
            route.path = path.join('/', prefix, route.path); // 组合控制器路由前缀
            router.addRoute(route);
        }
    };
};

/**
 * 导出请求方法装饰器
 */
export const Request = createMethodDecorator(Method.REQUEST);
export const Get = createMethodDecorator(Method.GET);
export const Post = createMethodDecorator(Method.POST);
export const Put = createMethodDecorator(Method.PUT);
export const Delete = createMethodDecorator(Method.DELETE);
export const Patch = createMethodDecorator(Method.PATCH);
export const Head = createMethodDecorator(Method.HEAD);
export const Options = createMethodDecorator(Method.OPTIONS);