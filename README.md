# Rainboot
Rainboot is a simple, lightweight, independent restful framework based on Typescript and decorators.

## Get started
```
npm i rainboot
```

## Create Entry
```
// index.ts
import { Rainboot } from 'rainboot';
import { TestMiddleware } from './TestMiddleware';
import { TestTemplateEngine } from './TestTemplateEngine';

const app = new Rainboot();
app.assets('test/assets');
app.controllers('test/controller');
app.use(new TestMiddleware());
app.engine(new TestTemplateEngine())
app.run();
```

## Create Controller
```
// TestController.ts
import { Context, Controller, Get, Post, Request, Template, HttpError } from "rainboot";

@Controller()
export class TestController {

    @Request('/:id/:name') // Routes are matched in order of addition
    public testRequest(ctx: Context) {
        return {
            method: ctx.method,
            url: ctx.url,
            params: ctx.params,
            query: ctx.query,
            route: ctx.route,
            headers: ctx.headers,
            cookies: ctx.cookies,
            body: ctx.body,
            error: ctx.error
        };
    }

    @Post('/post')
    public async testPost(ctx: Context) {
        console.log('body=', await ctx.body)
        ctx.setHeader('Content-Type', 'text/plain')
        return 'I am post back.';
    }

    @Get('/forward')
    public testForward(ctx: Context) {
        this.hello();
        ctx.setCookie('token', '%cDa^Pc)2-Nmc');
        ctx.forward('/1000/nacy');
    }

    @Get('/throw')
    public testThrowError(ctx: Context) {
        throw new HttpError('Test Throw Error', 403);
    }

    @Get('/error')
    public testError(ctx: Context) {
        if (1 == 1) throw new HttpError('This is error in error')
        return {
            status: ctx.error?.status,
            message: ctx.error?.message,
            stack: ctx.error?.stack
        };
    }

    @Get('/template')
    @Template('index')
    public testTemplate(ctx: Context) {
        return {
            title: 'page title',
            desc: 'page description'
        }
    }

    private hello() {
        console.log('---------- private call')
    }

}
```

## Implements Template Engine
```
// ArtTemplateEngine.ts
import { TemplateEngine } from 'rainboot';
import template from 'art-template'; // npm i art-template or others

export class ArtTemplateEngine implements TemplateEngine {

    public constructor() {
        template.defaults.extname = '.html';
        template.defaults.root = 'templates';
        template.defaults.debug = false;
    }

    // Override
    public render(templateFile: string, data: any) {
        return template(templateFile, data);
    }

}
```

## Implements Middleware
```
// TestMiddleware.ts
import { Context,Middleware } from 'rainboot';

export class TestMiddleware implements Middleware {

    public perform(ctx: Context) {
        ctx.setHeader('x-custome-header', 'test middleware');
    }

}
```

## Deployment & Publish
```
npm i
npm run build
cd lib
npm publish
```