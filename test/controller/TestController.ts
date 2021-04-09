import { Context } from "../../src/core/Context";
import { Controller, Get, Post, Request, Template } from "../../src/core/Decorator";
import { HttpError } from "../../src/def/HttpError";

@Controller()
export class TestController {

    @Request('/:id/:name')
    public testRequest(context: Context) {
        return {
            method: context.method,
            url: context.url,
            params: context.params,
            query: context.query,
            route: context.route,
            headers: context.headers,
            cookies: context.cookies,
            body: context.body,
            error: context.error
        };
    }

    @Post('/post')
    public async testPost(context: Context) {
        console.log('body=', await context.body)
        context.setHeader('Content-Type', 'text/plain')
        return 'I am post back.';
    }

    @Get('/forward')
    public testForward(context: Context) {
        this.hello();
        context.setCookie('token', '%cDa^Pc)2-Nmc');
        context.forward('/1000/nacy');
    }

    @Get('/throw')
    public testThrowError(context: Context) {
        throw new HttpError('Test Throw Error', 403);
    }

    @Get('/error')
    public testError(context: Context) {
        if (1 == 1) throw new HttpError('This is error in error')
        return {
            status: context.error?.status,
            message: context.error?.message,
            stack: context.error?.stack
        };
    }

    @Get('/template')
    @Template('index')
    public testTemplate(context: Context) {
        return {
            title: 'page title',
            desc: 'page description'
        }
    }

    private hello() {
        console.log('---------- private call')
    }

}