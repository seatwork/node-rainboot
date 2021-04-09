import { Application } from '../src/core/Application';
import { TestMiddleware } from './TestMiddleware';
import { TestTemplateEngine } from './TestTemplateEngine';

const app = new Application();
app.setStaticResourcePath('test/assets');
app.setControllerPath('test/controller');
app.addMiddleware(new TestMiddleware());
app.setTemplateEngine(new TestTemplateEngine())
app.run();