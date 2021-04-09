import { Context } from '../src/core/Context';
import { Middleware } from '../src/def/Plugin';

export class TestMiddleware implements Middleware {

    public perform(context: Context) {
        context.setHeader('x-custome-header', 'test middleware');
    }

}