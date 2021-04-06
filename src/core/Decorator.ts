import path from "path";
import 'reflect-metadata';
import { METADATA_ARGS, METADATA_ROUTES, METHOD_DELETE, METHOD_GET, METHOD_HEAD, METHOD_OPTIONS, METHOD_PATCH, METHOD_POST, METHOD_PUT, PARAM_REQUEST, PARAM_RESPONSE } from "../def/Constant";
import { Route } from "../def/Route";
import { Container } from "./Container";

const container = Container.getInstance();

/**
 * 创建请求方法装饰器
 * @param method 请求方法名
 * @returns 
 */
const createMethodDecorator = (method: string) => (path: string): MethodDecorator => {
    return (target, name) => {
        // 获取类元数据
        const routes = Reflect.getMetadata(METADATA_ROUTES, target.constructor) as Array<Route> || [];
        const args = Reflect.getMetadata(METADATA_ARGS, target.constructor, name) || [];

        // 由于同一个方法上可能存在多个装饰器（如 @GET 和 @Template），在使用时可能并不按照优先级放置，
        // 所以每个装饰器执行时都需要先查找是否已经存在，存在则在原对象上附加属性，不存在则直接添加新对象。
        const route = routes.find(v => v.handle === name);
        if (route) {
            Object.assign(route, { method, path, handle: name as string, arguments: args })
        } else {
            routes.push({ method, path, handle: name as string, arguments: args });
        }
        // 将元数据重新绑定到所在类
        Reflect.defineMetadata(METADATA_ROUTES, routes, target.constructor);
    };
}

/**
 * 创建请求参数装饰器
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
 * 创建模板装饰器
 * @param path 
 * @returns 
 */
export const Template = (path: string): MethodDecorator => {
    return (target, name) => {
        const routes = Reflect.getMetadata(METADATA_ROUTES, target.constructor) as Array<Route> || [];
        const route = routes.find(v => v.handle === name);

        if (route) {
            route.template = path;
        } else {
            routes.push({ handle: name as string, template: path });
        }
        Reflect.defineMetadata(METADATA_ROUTES, routes, target.constructor);
    };
}

/**
 * 创建控制器装饰器
 * @param prefix 路由前缀
 * @returns 
 */
export const Controller = (prefix: string = ''): ClassDecorator => {
    return (constructor: any) => {
        // 获取方法装饰器触发时绑定的路由元数据
        const routes: Route[] = Reflect.getMetadata(METADATA_ROUTES, constructor);
        const controller = new constructor();

        // 将所有路由添加到缓存
        for (let route of routes) {
            if (!route.path) continue;
            route.controller = controller; // 添加控制器实例
            route.path = path.join('/', prefix, route.path); // 组合控制器路由前缀
            container.addRoute(route);
        }
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