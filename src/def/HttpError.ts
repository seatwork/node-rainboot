import { HttpStatus } from "./Constant";

/**
 * 自定义错误
 */
export class HttpError extends Error {

    public status: number;

    public constructor(message: string, status?: number) {
        super(message);
        this.status = !status || status < 400 || status > 511
            ? HttpStatus.INTERNAL_SERVER_ERROR : status;
    }

}