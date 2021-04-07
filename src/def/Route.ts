/**
 * 路由对象接口
 */
export interface Route {

    method?: string;    // 请求方法
    path?: string;      // 请求路径

    controller?: any;   // 控制器实例
    handle?: string;    // 控制器方法名
    template?: string;  // 模板文件路径
    arguments?: {       // 控制器方法参数数组
        type: string,
        field: string,
        index: number
    }[];

}