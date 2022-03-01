import fs from 'fs';
import Http from 'http';
import path from 'path';
import zlib from 'zlib';
import { HttpError } from '..';
import { App, HttpStatus, Method, MimeType } from '../def/Constant';
import { Middleware, TemplateEngine } from '../def/Plugin';
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
    public controllers(dir: string) {
        this.scanControllers(path.resolve(dir));
    }

    /**
     * 设置静态资源目录（并添加静态路由）
     * @param dir
     */
    public assets(dir: string) {
        this.router.addRoute({
            method: 'GET',
            path: path.join('/', dir, '/.+')
        });
    }

    /**
     * 设置模板引擎
     * @param engine
     */
    public engine(engine: TemplateEngine) {
        this.templateEngine = engine;
    }

    /**
     * 添加中间件
     * @param middleware
     */
    public use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * 创建并启动应用服务器
     * @param port 默认端口 3000
     */
    public run(port: number = 3000) {
        const server = Http.createServer(async (request: Http.IncomingMessage, response: Http.ServerResponse) => {
            const context = new Context(request, response);
            await this.handleRequest(context);
        });

        return server.listen(port, () => {
            console.log(`\x1b[90m${App.NAME} ^${App.VERSION} - ${App.REPO}\x1b[0m`)
            console.log(`> \x1b[32mReady!\x1b[0m Running at \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`)
        });
    }

    /**
     * 处理动态请求
     * @param context
     * @returns
     */
    private async handleRequest(context: Context) {
        const method = context.method || Method.REQUEST;
        const url = context.url || '/';

        try {
            // 执行中间件
            for (const middleware of this.middlewares) {
                await middleware.perform(context);
            }

            // 查找路由（未找到则返回404状态）
            const route = this.router.findRoute(method, url);
            if (!route) {
                throw new HttpError('Route not found', HttpStatus.NOT_FOUND);
            }

            // 没有控制器的路由作为静态资源处理
            if (!route.handle) {
                this.handleStaticResource(context);
                return;
            }

            // 执行路由控制器方法
            context.setRoute(route);
            const result = await route.controller[route.handle](context);

            // 如果控制器已经发送响应
            if (context.isHeadersSent()) {
                return;
            }

            // 如果存在内部跳转则按新路由再次执行
            if (context.url !== url) {
                await this.handleRequest(context);
                return;
            }

            // 设置响应时间
            const ms = Date.now() - context.locals.time;
            context.setHeader('X-Response-Time', `${ms}ms`);

            // 如果存在模板装饰器则渲染模板
            if (route.template) {
                if (!this.templateEngine) {
                    context.send('Template engine has not been configured.', HttpStatus.INTERNAL_SERVER_ERROR);
                    return;
                }
                context.send(this.templateEngine.render(route.template, result), context.error?.status);
                return;
            }
            // 返回控制器执行结果
            context.send(result, context.error?.status);
        } catch (e: any) {
            e.status = e.status || HttpStatus.INTERNAL_SERVER_ERROR;

            // 如果存在全局错误控制
            if (context.url !== App.ERROR_HANDLER && this.router.findRoute(method, App.ERROR_HANDLER)) {
                context.forward(App.ERROR_HANDLER)
                context.setError(e);
                this.handleRequest(context);
            } else {
                console.error('\x1b[31m[ERROR]', method, url, e.stack || e, '\x1b[0m');
                context.send(e.message || e.stack || e, e.status);
            }
        }
    }

    /**
     * 处理静态资源
     * @param context
     */
    private handleStaticResource(context: Context) {
        const url = context.url;
        if (!url) return;

        // 将虚拟相对路径去掉开头斜杠转换为绝对路径
        const filename = path.resolve(url.replace(/^\/+/, ''));
        const extname = path.extname(filename).substring(1).toUpperCase();

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
        const encoding = context.headers['accept-encoding'] || '';

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