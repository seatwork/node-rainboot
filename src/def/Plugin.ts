import { Context } from "../core/Context";

/**
 * 中间件接口
 */
export interface Middleware {
    /**
     * 执行方法
     * @param request 
     * @param response 
     */
    perform(context: Context): void;
}

/**
 * 模板引擎接口
 */
export interface TemplateEngine {
    /**
     * 页面渲染方法
     * @param templateFile 模板文件路径
     * @param data 模板数据模型
     */
    render(templateFile: string, data: any): string;
}