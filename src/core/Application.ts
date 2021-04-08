import fs from 'fs';
import Http from 'http';
import path from 'path';
import zlib from 'zlib';
import { Decorator, HttpStatus, MimeType } from '../def/Constant';
import { Middleware, TemplateEngine } from '../def/Plugin';
import { name, url, version } from '../package.json';
import { Context } from './Context';
import { Router } from './Router';

/**
 * 应用程序启动类
 */
export class Application {

    private middlewares: Middleware[] = []; // 中间件容器
    private router = Router.getInstance(); // 路由管理器
    private templateEngine?: TemplateEngine; // 模板引擎

    /**
     * 设置控制器目录（并扫描控制器）
     * @param dir
     */
    public setControllerPath(dir: string) {
        this.scanControllers(path.resolve(dir));
    }

    /**
     * 设置静态资源目录（并添加静态路由）
     * @param dir
     */
    public setStaticResourcePath(dir: string) {
        this.router.addRoute({
            method: 'GET',
            path: path.join('/', dir, '/.+')
        });
    }

    /**
     * 设置模板引擎
     * @param engine
     */
    public setTemplateEngine(engine: TemplateEngine) {
        this.templateEngine = engine;
    }

    /**
     * 添加中间件
     * @param middleware
     */
    public addMiddleware(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * 创建并启动应用服务器
     * @param port 默认端口 3000
     */
    public run(port: number = 3000) {
        const server = Http.createServer((request: Http.IncomingMessage, response: Http.ServerResponse) => {
            const context = new Context(request, response);
            this.runMiddlewares(context);
            this.handleRequest(context);
        });

        return server.listen(port, () => {
            console.log(`\x1b[90m${name} ^${version} - ${url}\x1b[0m`)
            console.log(`> \x1b[32mReady!\x1b[0m Running at \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`)
        });
    }

    /**
     * 遍历执行中间件
     * @param context
     */
    private runMiddlewares(context: Context) {
        for (const middleware of this.middlewares) {
            middleware.perform(context);
        }
    }

    /**
     * 处理动态请求
     * @param context
     * @returns
     */
    private handleRequest(context: Context) {
        const method = context.getMethod();
        const url = context.getUrl();
        if (!method || !url) {
            context.send('Request method or url cannot be found.', HttpStatus.BAD_REQUEST);
            return;
        }

        try {
            // 查找路由（未找到则返回404状态）
            const route = this.router.findRoute(method, url);
            if (!route) {
                context.send(`Route not found: ${url}`, HttpStatus.NOT_FOUND);
                return;
            }

            // 没有控制器的路由作为静态资源处理
            if (!route.handle) {
                this.handleStaticResource(context);
                return;
            }

            // 代理执行路由控制器方法（解析参数装饰器）
            context.setRoute(route);
            const proxyHandle = this.createProxyHandle(context);
            const result = proxyHandle();

            // 如果存在内部跳转则按新路由再次执行
            if (context.getUrl() !== url) {
                this.handleRequest(context);
                return;
            }

            // 如果存在模板装饰器则渲染模板
            if (route.template) {
                if (!this.templateEngine) {
                    context.send('Template engine has not been configured.', HttpStatus.INTERNAL_SERVER_ERROR);
                    return;
                }
                context.send(this.templateEngine.render(route.template, result));
                return;
            }
            // 返回控制器执行结果
            context.send(result);
        } catch (e) {
            console.error('\x1b[31m[ERROR]', method, url, e.stack || e, '\x1b[0m');
            context.send(e.message || e.stack || e, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 解析参数装饰器并代理控制器方法
     * @returns
     */
    private createProxyHandle(context: Context) {
        // 返回代理后的方法
        return () => {
            const route = context.getRoute();
            if (!route) throw new Error('No route available in request.');
            if (!route.handle) throw new Error('No handle available in controller.');

            // 遍历带有装饰器的参数重新赋值
            const args = Array.from(arguments);
            if (route.arguments) {
                for (let arg of route.arguments) {
                    const i = arg.index;
                    switch (arg.type) {
                        case Decorator.RESPONSE: args[i] = context.getRequest(); break;
                        case Decorator.RESPONSE: args[i] = context.getResponse(); break;
                        case Decorator.CONTEXT: args[i] = this.getArgument(context, arg.field); break;
                        default: break;
                    }
                }
            }

            // 用新参数执行控制器方法
            const handle = route.controller[route.handle];
            return handle.apply(route.controller, args);
        }
    }

    /**
     * 根据参数装饰器的 field 获取对应数据
     * @param field
     * @returns
     */
    private getArgument(context: Context, field: string) {
        if (!field) return context;

        switch (field.toUpperCase()) {
            case Decorator.REQUEST_METHOD: return context.getMethod();
            case Decorator.REQUEST_URL: return context.getUrl();
            case Decorator.REQUEST_HEADERS: return context.getHeaders();
            case Decorator.REQUEST_COOKIES: return context.getCookies();
            case Decorator.REQUEST_PARAMS: return context.getParameters();
            case Decorator.REQUEST_QUERIES: return context.getQueries();
            case Decorator.REQUEST_BODY: return context.getBody();
            default: return context;
        }
    }

    /**
     * 处理静态资源
     * @param context
     */
    private handleStaticResource(context: Context) {
        const url = context.getUrl();
        if (!url) return;

        // 将虚拟相对路径去掉开头斜杠转换为绝对路径
        const filename = path.resolve(url.replace(/^\/+/, ''));
        const extname = path.extname(filename).substr(1).toUpperCase();

        // 资源不存在
        if (!fs.existsSync(filename)) {
            context.send('Resource not found: ' + url, HttpStatus.NOT_FOUND);
            return;
        }

        // 资源并非文件类型
        const stat = fs.statSync(filename)
        if (!stat.isFile()) {
            context.send('Resource not acceptable: ' + url, HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        // 设置响应头
        context.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        context.setHeader('Last-Modified', new Date(stat.mtime).toUTCString());
        if (MimeType[extname]) {
            context.setHeader('Content-Type', MimeType[extname]);
        }

        // 读取文件通过管道输出
        const stream = fs.createReadStream(filename)
        const encoding = context.getHeader('accept-encoding') || '';

        if (encoding.includes('gzip')) {
            context.setHeader('Content-Encoding', 'gzip');
            context.send(stream.pipe(zlib.createGzip()));
        } else {
            context.send(stream);
        }
    }

    /**
     * 扫描控制器目录以触发装饰器
     * @param dir
     */
    private scanControllers(dir: string) {
        const files = fs.readdirSync(dir);

        for (let file of files) {
            file = path.join(dir, file);
            if (/(\.d\.ts|\.js\.map)$/.test(file)) continue;

            if (fs.statSync(file).isDirectory()) {
                this.scanControllers(file);
            } else {
                require(file.replace(/(\.ts|\.js)$/, ''));
            }
        }
    }

}