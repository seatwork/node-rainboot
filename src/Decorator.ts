import path from "path";
import 'reflect-metadata';
import { METADATA_ARGS, METADATA_ROUTES, METHOD_DELETE, METHOD_GET, METHOD_HEAD, METHOD_OPTIONS, METHOD_PATCH, METHOD_POST, METHOD_PUT, PARAM_REQUEST, PARAM_RESPONSE } from "./Constant";
import { Route } from "./web/Route";
import { Router } from "./web/Router";

/**
 * 创建方法装饰器
 * @param method 请求方法名
 * @returns 
 */
const createMethodDecorator = (method: string) => (path: string): MethodDecorator => {
    return (target, name) => {
        const routes = Reflect.getMetadata(METADATA_ROUTES, target.constructor) as Array<Route> || [];
        const args = Reflect.getMetadata(METADATA_ARGS, target.constructor, name) || [];

        // 将元数据绑定到所在类
        routes.push({ method, path, handle: name as string, arguments: args });
        Reflect.defineMetadata(METADATA_ROUTES, routes, target.constructor);
    };
}

/**
 * 创建参数装饰器
 * @param type 参数类型
 * @returns 
 */
const createParamDecorator = (type: string) => (field?: string): ParameterDecorator => {
    return (target, name, index) => {
        const args = Reflect.getMetadata(METADATA_ARGS, target.constructor, name) || [];
        args.push({ type, field, index })
        Reflect.defineMetadata(METADATA_ARGS, args, target.constructor, name);
    };
}

/**
 * 创建类装饰器：Controller
 * @param prefix 路由前缀
 * @returns 
 */
export const Controller = (prefix: string = ''): ClassDecorator => {
    return (constructor: any) => {
        // 获取方法装饰器触发时绑定的路由元数据
        const routes: Array<Route> = Reflect.getMetadata(METADATA_ROUTES, constructor);
        const controller = new constructor();

        // 将所有路由添加到缓存
        routes.forEach(route => {
            route.controller = controller
            route.path = path.join('/', prefix, route.path);
            Router.addRoute(route);
        })
    };
};

/**
 * 导出请求方法装饰器
 */
export const Get = createMethodDecorator(METHOD_GET);
export const Post = createMethodDecorator(METHOD_POST);
export const Put = createMethodDecorator(METHOD_PUT);
export const Delete = createMethodDecorator(METHOD_DELETE);
export const Patch = createMethodDecorator(METHOD_PATCH);
export const Head = createMethodDecorator(METHOD_HEAD);
export const Options = createMethodDecorator(METHOD_OPTIONS);

/**
 * 导出参数装饰器
 */
export const Request = createParamDecorator(PARAM_REQUEST);
export const Response = createParamDecorator(PARAM_RESPONSE);