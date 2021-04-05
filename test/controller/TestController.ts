import { Controller, Get, Post, Request, Response } from "../../src/Decorator";
import { HttpError } from "../../src/http/HttpError";

@Controller('/test')
export class TestController {

    @Get('/user/:id/:name')
    getUsers(
        @Request('body') body: any,
        @Request('param') param: any,
        @Request('query') query: {},
        @Request('headers') headers: any,
        @Request() request: any,
        @Response() response: any) {

        console.log('body=', body);
        console.log('param=', param);
        console.log('query=', query);
        console.log('headers=', headers);
        console.log('user-agent=', request.getHeader('user-agent'));
        // response.send('xxxxxx', 403)
        return param;
    }

    @Get('/user')
    getUser() {
        // Assert.isTrue(1 > 1, 'this is an error.', 416);
        throw new HttpError('ajflkdsafjlds', 430)
        return { name: 'xehu', age: 22 }
    }


    @Post('/user2')
    getUser2(@Request('body') body: any) {
        console.log(body.subject)
        return body
    }

}
