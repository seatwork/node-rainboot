import Http from 'http';
import { Container } from '../core/Container';
import { Router } from '../core/Router';
import { name, url, version } from '../package.json';
import { Strings } from '../util/Strings';
import { HttpRequest } from './HttpRequest';
import { HttpResponse } from './HttpResponse';
import { HttpStatus } from './HttpStatus';

/**
 * 应用服务器
 */
export class HttpServer {

    private container = Container.getInstance();
    private server: Http.Server;

    /**
     * 创建应用服务器
     */
    public constructor() {
        this.server = Http.createServer((req, res) => {
            // 封装请求和响应
            const request = new HttpRequest(req);
            const response = new HttpResponse(res);

            // 遍历执行中间件
            for (const middleware of this.container.getMiddlewares()) {
                middleware.perform(request, response);
            }
            // 处理请求
            this.process(request, response);
        });
    }

    /**
     * 启动应用服务器
     * @param port
     */
    public run(port: number) {
        this.server.listen(port, () => {
            console.log(`\x1b[90m${Strings.capitalizeFirstChar(name)} ^${version} - ${url}\x1b[0m`)
            console.log(`> \x1b[32mReady!\x1b[0m Running at \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`)
        })
    }

    /**
     * 请求处理入口
     * @param request
     * @param response
     * @returns
     */
    private async process(request: HttpRequest, response: HttpResponse) {
        const method = request.getMethod();
        const url = request.getUrl();
        if (!method || !url) {
            response.send('Request method or url cannot be found.', HttpStatus.BAD_REQUEST);
            return;
        }

        try {
            // 查找路由（未找到则返回404状态）
            const router = new Router(request, response);
            const route = router.getRoute();
            if (!route) {
                response.send(`Route not found: ${url}`, HttpStatus.NOT_FOUND);
                return;
            }

            // 没有控制器的路由作为静态资源处理
            if (!route.handle) {
                const encoding = request.getHeader('accept-encoding') || '';
                response.pipe(url, encoding.includes('gzip'));
                return;
            }

            // 代理执行路由控制器方法
            const result = await router.execute();

            // 如果已经在控制器中发送响应不作处理
            if (response.isHeadersSent()) {
                return;
            }

            // 如果存在内部跳转则按新路由再次执行
            if (request.getUrl() !== url) {
                this.process(request, response);
                return;
            }

            //  如果没有返回值返回204状态
            if (result === undefined) {
                response.send(result, HttpStatus.NO_CONTENT);
                return;
            }

            // 如果存在模板装饰器则渲染模板
            if (route.template) {
                const engine = this.container.getTemplateEngine();
                if (!engine) {
                    response.send('Template engine has not been configured.', HttpStatus.INTERNAL_SERVER_ERROR);
                    return;
                }
                response.send(engine.render(route.template, result));
                return;
            }

            // 返回控制器执行结果
            response.send(result);

        } catch (e) {
            console.error('\x1b[31m[ERROR]', method, url, e.stack || e, '\x1b[0m');
            response.send(e.message || e.stack || e, e.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}