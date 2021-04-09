# Rainboot
Rainboot is a simple, lightweight, independent restful framework based on Typescript and decorators.

## Get started
```
npm i rainboot
```

## Create Entry
```
// index.ts
import { Application } from 'rainboot/core/Application';
import { TestMiddleware } from './TestMiddleware';
import { TestTemplateEngine } from './TestTemplateEngine';

const app = new Application();
app.setStaticResourcePath('test/assets');
app.setControllerPath('test/controller');
app.addMiddleware(new TestMiddleware());
app.setTemplateEngine(new TestTemplateEngine())
app.run();
```

## Create Controller
```
// TestController.ts
import { Context } from "rainboot/core/Context";
import { Controller, Get, Post, Request, Template } from "rainboot/core/Decorator";
import { HttpError } from "rainboot/def/HttpError";

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
```

## Implements Template Engine
```
// ArtTemplateEngine.ts
import { TemplateEngine } from 'rainboot/def/Plugin';
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
import { Context } from 'rainboot/core/Context';
import { Middleware } from 'rainboot/def/Plugin';

export class TestMiddleware implements Middleware {

    public perform(context: Context) {
        context.setHeader('x-custome-header', 'test middleware');
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