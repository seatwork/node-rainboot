/**
 * 路由实体类
 */
export interface Route {

    method: string;     // 请求方法
    path: string;       // 请求路径
    param?: {};         // （解析后的）请求路径参数对象
    query?: {};         // （解析后的）QueryString对象

    controller?: any;   // 控制器实例
    handle: string;     // 控制器方法名
    arguments: {        // 控制器方法参数
        type: string,
        field: string,
        index: number
    }[];

}