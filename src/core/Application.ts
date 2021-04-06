import fs from 'fs';
import path from 'path';
import { Middleware, TemplateEngine } from '../def/Plugin';
import { HttpServer } from '../http/HttpServer';
import { Container } from './Container';

/**
 * 应用程序启动类
 */
export class Application {

    private container = Container.getInstance();

    /**
     * 设置控制器目录（并扫描控制器）
     * @param dir 
     */
    public setControllerPath(dir: string) {
        this.scanControllers(path.join(process.cwd(), dir));
    }

    /**
     * 设置静态资源目录（并添加静态路由）
     * @param dir
     */
    public setStaticResourcePath(dir: string) {
        this.container.addRoute({
            method: 'GET',
            path: path.join('/', dir, '/.+')
        });
    }

    /**
     * 设置模板引擎
     * @param engine 
     */
    public setTemplateEngine(engine: TemplateEngine) {
        this.container.setTemplateEngine(engine);
    }

    /**
     * 添加中间件
     * @param middleware 
     */
    public addMiddleware(middleware: Middleware) {
        this.container.addMiddleware(middleware);
    }

    /**
     * 启动应用服务器
     * @param port 默认端口 3000
     */
    public run(port: number = 3000) {
        if (this.container.getRoutes().length === 0) {
            console.warn('\x1b[33m[WARNING]', 'Route has not been configured.', '\x1b[0m');
        }
        new HttpServer().run(port);
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