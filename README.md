# Rainboot
Rainboot is a simple, lightweight, independent restful framework based on Typescript and decorators.

## Get started
```
// index.ts
import { Application } from "rainboot";
import { ArtTemplateEngine } from "./plugin/ArtTemplateEngine";
import { TestMiddleware } from "./plugin/TestMiddleware";

const app = new Application()
app.setStaticResourcePath('assets');
app.setControllerPath('controllers');
app.setTemplateEngine(new ArtTemplateEngine());
app.addMiddleware(new TestMiddleware());
app.run();
```

## Create Controller
```
// TestController.ts
import { Controller, Get, Request, Response, Template } from "rainboot/core/Decorator";

@Controller('/test')
export class TestController {

    @Get('/user/:id')
    @Template('index') // Optional
    public async getUser(

        @Request() req: any,
        @Request('headers') headers: any,
        @Request('cookies') request: any,
        @Request('body') body: any,
        @Request('param') param: any,
        @Request('query') query: any,
        @Response() res: any) {

        return {
            name: 'Rainboot',
            age: 23
        };
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
import { HttpRequest } from 'rainboot/http/HttpRequest';
import { HttpResponse } from 'rainboot/http/HttpResponse';

export class TestMiddleware implements Middleware {

    // Override
    public perform(request: HttpRequest, response: HttpResponse) {
        // Todo
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