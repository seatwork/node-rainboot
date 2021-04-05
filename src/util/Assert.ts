import { HttpError } from "../http/HttpError";

/**
 * 自定义断言
 * 用于抛出带状态码的错误
 */
export class Assert {

    /**
     * 真断言
     * @param expression 
     * @param message 
     * @param status 
     */
    public static isTrue(expression: boolean, message: string, status?: number) {
        if (!expression) throw new HttpError(message, status);
    }

}