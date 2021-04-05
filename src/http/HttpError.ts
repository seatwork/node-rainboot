import { HttpStatus } from "./HttpStatus";

/**
 * 自定义错误类
 */
export class HttpError extends Error {

    private status: number;

    /**
     * 构造函数
     * @param message 错误信息
     * @param status HTTP 状态码（可选，400-511）
     */
    public constructor(message: string, status?: number) {
        if (!status || status < 400 || status > 511) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        super(message);
        this.status = status;
        this.name = 'HttpError';
    }

}