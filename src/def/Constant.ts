// 版本信息
export const enum App {
    NAME = 'Rainboot',
    VERSION = '0.1.2',
    REPO = 'https://github.com/seatwork/rainboot',
    ERROR_HANDLER = '/error'
}

// 元数据主键
export const enum Metadata {
    ROUTES = 'ROUTES',
}

// 请求方法主键
export const enum Method {
    REQUEST = 'REQUEST',
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
}

// 装饰器主键
export const enum Decorator {
    CONTEXT = 'CONTEXT',
    REQUEST = 'REQUEST',
    RESPONSE = 'RESPONSE',

    REQUEST_METHOD = 'METHOD',
    REQUEST_URL = 'URL',
    REQUEST_HEADERS = 'HEADERS',
    REQUEST_COOKIES = 'COOKIES',
    REQUEST_PARAMS = 'PARAMS',
    REQUEST_QUERIES = 'QUERIES',
    REQUEST_BODY = 'BODY',
}

// 常用状态码
export const enum HttpStatus {
    SUCCESS = 200,
    NO_CONTENT = 204,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    REQUEST_TIMEOUT = 408,
    PAYLOAD_TOO_LARGE = 413,
    UNSUPPORTED_MEDIA_TYPE = 415,
    TOO_MANY_REQUESTS = 429,

    INTERNAL_SERVER_ERROR = 500,
}

// 常用静态文件类型
export const MimeType: any = {
    HTM: 'text/html;charset:utf-8',
    HTML: 'text/html;charset:utf-8',
    XML: 'text/xml;charset:utf-8',
    CSS: 'text/css;charset:utf-8',
    TXT: 'text/plain;charset:utf-8',
    PNG: 'image/png',
    JPG: 'image/jpeg',
    JPEG: 'image/jpeg',
    GIF: 'image/gif',
    SVG: 'image/svg+xml',
    ICO: 'image/x-icon',
    TIF: 'image/tiff',
    MP3: 'audio/mpeg',
    MP4: 'video/mp4',
    TTF: 'font/ttf',
    WOFF: 'font/woff',
    WOFF2: 'font/woff2',
    JSON: 'application/json',
    ZIP: 'application/zip',
}