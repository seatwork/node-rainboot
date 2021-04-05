import fs from 'fs';
import path from 'path';
import { Server } from './web/Server';

/**
 * 应用程序启动类
 */
export class Application {

    /**
     * 设置控制器目录
     * @param dir 
     */
    setControllerPath(dir: string) {
        this.scanControllers(path.join(process.cwd(), dir));
    }

    /**
     * 启动应用服务器
     * @param port 默认端口 3000
     */
    run(port: number | undefined = 3000) {
        new Server().run(port);
    }

    /**
     * 扫描控制器目录以触发装饰器
     * @param dir 
     */
    private scanControllers(dir: string) {
        const files = fs.readdirSync(dir);

        for (let file of files) {
            file = path.join(dir, file);
            if (/(\.d\.ts|\.js\.map)$/.test(file)) continue;

            if (fs.statSync(file).isDirectory()) {
                this.scanControllers(file);
            } else {
                require(file.replace(/(\.ts|\.js)$/, ''));
            }
        }
    }

}
