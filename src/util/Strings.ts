/**
 * 字符串工具类
 */
export class Strings {

    private static readonly IP_V4 = /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/
    private static readonly IP_V6 = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i

    /**
     * 首字母大写
     * @param str 
     * @returns 
     */
    public static capitalizeFirstChar(str: string) {
        return str.toLowerCase().replace(/^\S/, s => s.toUpperCase());
    }

    /**
     * 判断是否为IP地址
     * @param str 
     * @returns 
     */
    public static isIpAddress(str: string) {
        return this.IP_V4.test(str) || this.IP_V6.test(str)
    }

}