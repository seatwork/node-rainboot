import { Rainboot } from '../src';
import { TestMiddleware } from './TestMiddleware';
import { TestTemplateEngine } from './TestTemplateEngine';

const app = new Rainboot();
app.assets('test/assets');
app.controllers('test/controller');
app.use(new TestMiddleware());
app.engine(new TestTemplateEngine())
app.run();