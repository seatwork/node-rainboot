/**
 * 路由对象接口
 */
export interface Route {

    method?: string;    // 请求方法
    path?: string;      // 请求路径
    params?: {};        // 路径参数
    query?: {};         // 查询参数

    controller?: any;   // 控制器实例
    handle?: string;    // 控制器方法名
    template?: string;  // 模板文件路径

}