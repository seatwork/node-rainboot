import { Application } from '../src/Application';

const app = new Application()
app.setControllerPath('dist/test/controller');
// app.setStaticResourcePath();
// app.setTemplatePath();
// app.enableCors();
// app.setAllowOrigins();
// app.setAllowCredentials();
// app.setAllowMethods();
// app.setAllowHeaders();
app.run();
