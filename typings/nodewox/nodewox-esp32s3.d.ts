/**
 * 硬件构架标识
 */
declare const NODEWOX_MACHINE = "esp32s3";

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

type Byte = IntRange<0, 256>; // 0..255

declare function require(name: string): Object;

declare function setTimeout(callback: () => void, duration: number): number;
declare function setInterval(callback: () => void, duration: number): number;
declare function clearTimeout(timer: number): void;
declare function clearInterval(timer: number): void;

interface Console {
  /**
   * 自定义日志输出回调。null表示无，否则为自定义处理函数。
   */
  handler: Function | null;

  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;

  /**
   * Print to default console only, don't call user handler.
   */
  print(...args: any[]): void;
}

declare const console: Console;

declare type BufferedType =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | ArrayBuffer
  | DataView;

type F<ARGS extends Array<any>> = (...args: ARGS) => void;

/**
 * 事件监听接口。
 *
 * @description
 * 用于为对象增加或取消事件监听。
 */
interface EventEmitter<EVENTS extends { [key: string]: Array<any> }> {
  /**
   * 添加监听
   * @param type Event type
   * @param handler A callback function to process the incomming event
   */
  on<T extends keyof EVENTS>(
    type: T,
    handler: (...args: EVENTS[T]) => void
  ): this;

  /**
   * 添加一次性监听
   * @param type Event type
   * @param handler A callback function to process the incomming event
   */
  once<T extends keyof EVENTS>(
    type: T,
    handler: (...args: EVENTS[T]) => void
  ): this;

  /**
   * 取消监听
   */
  off<T extends keyof EVENTS>(
    type: T,
    handler: (...args: EVENTS[T]) => void
  ): this;

  /**
   * 触发事件
   *
   * @param type 事件类型
   * @param args 事件参数
   */
  emit<T extends keyof EVENTS>(type: T, ...args: EVENTS[T]): this;
}

/**
 * 事件对象
 *
 * @experimental
 */
interface Event<DATA> {
  /**
   * 事件类型
   */
  readonly type: string;

  /**
   * 事件产生的源对象
   */
  readonly target: Object;

  /**
   * 事件附带数据
   */
  readonly data: DATA;
}

/**
 * 事件派发
 * @experimental
 */
interface EventDispatcher<EVENTS extends { [key: string]: Object }> {
  dispatch<T extends keyof EVENTS>(
    type: T,
    handler: (event: Event<EVENTS[T]>) => void
  ): this;
}

declare function decodeUtf8String(buffer: BufferedType): string;

declare function eval(source: string, filename?: string): any;

/**
 * 字节码
 */
interface Bytecode {}

/**
 * 将js脚本编译为字节码
 *
 * @param source js源码
 * @param filename 文件名
 * @param mode 模式
 * @returns 字节码
 */
declare function compile(
  source: string,
  filename: string,
  mode: "eval" | "module",
  debug?: boolean
): Bytecode;

/**
 * 执行字节码
 *
 * @param target 字节码
 * @returns eval模式:求值结果, module模式:模块引用对象
 */
declare function evalBytecode(bc: Bytecode): any;

/**
 * 将模块序列化为二进制表示。
 *
 * @descriptions
 * 对于module模式的字节码，如该模块字节码已被执行过，其不能再序列化。
 *
 * @param target 字节码
 * @returns 字节数组
 */
declare function dumpBytecode(target: Bytecode): ArrayBuffer;

/**
 * 将二进制字节转换为字节码。
 *
 * @param target 字节数据
 * @returns 字节码
 */
declare function loadBytecode(bytes: BufferedType): Bytecode;

/**
 * 从流中读取数据
 */
interface ReadStream {
  /**
   * 是否已关闭？
   */
  readonly closed: boolean;

  /**
   * 读取数据到指定缓冲对象。
   *
   * @param buffer - 缓冲对象
   * @returns 实际读取的字节数。
   */
  read(buffer: BufferedType): Promise<number>;

  /**
   * read() 的同步版本。阻塞直到读取完成。
   */
  readSync(buffer: BufferedType): number;

  /**
   * 读取全部数据。
   *
   * @description
   * 一次性读取全部数据。如果没有数据，返回null。仅对数据量小的情况下使用此方法。
   */
  readAll(): Promise<ArrayBuffer | null>;

  /**
   * readAll() 的同步版本。阻塞直到读取完成。
   */
  readAllSync(): ArrayBuffer | null;
}

/**
 * 向流中写数据
 */
interface WriteStream {
  /**
   * 是否已关闭？
   */
  readonly closed: boolean;

  /**
   * 写入数据
   *
   * @param data - 数据
   * @returns 实际写入的字节数
   */
  write(data: BufferedType | string | Array<Byte>): Promise<number>;

  /**
   * 写入全部数据
   *
   * @param data - 数据
   */
  writeAll(data: BufferedType | string | Array<Byte>): Promise<void>;

  writeSync(data: BufferedType | string | Array<Byte>): this;

  writeAllSync(data: BufferedType | string | Array<Byte>): this;
}

/**
 * 关闭流
 */
interface CloseStream {
  /**
   * 关闭Stream
   */
  close(): Promise<void>;
}

/**
 * 可读，可写，可关闭的流
 */
interface Stream extends ReadStream, WriteStream, CloseStream {}

declare module "audio" {
  import { i2s } from "nodewox";

  /**
   * 音频解码播放
   */
  class Audio implements EventEmitter<{ stop: [boolean] }> {
    /**
     * 构建实例
     *
     * @param url 音频文件url
     * @param options.chunkSize url数据分块获取大小，默认8192
     * @param options.chunkQueueLength 分块数，默认5
     * @param options.cacheSize 音频播放缓存大小，默认 600KB (600*1024)
     */
    constructor(
      url: String,
      options?: {
        chunkSize?: number;
        chunkQueueLength?: number;
        cacheSize?: number;
      }
    );

    /**
     * 播放输出通道
     */
    output: i2s.I2sWriter | null;

    /**
     * 是否播放完成?
     */
    readonly ended: boolean;

    /**
     * 开始播放
     */
    play(): this;
    stop(): this;

    on(type: "stop", handler: (finished: boolean) => void): this;
    once(type: "stop", handler: (finished: boolean) => void): this;
    off(type: "stop", handler: (finished: boolean) => void): this;
    emit(type: "stop", finished: boolean): this;

    /**
     * 设置默认播放输出通道
     *
     * @param output I2S输出通道，null表示无默认
     */
    static setDefaultOutput(output: i2s.I2sWriter | null): void;
  }
}

declare module "display" {
  import { Canvas, ColorMode } from "graphics";
  import { gpio, spi, i2c } from "nodewox";

  /**
   * 显示屏接口
   */
  class DisplayInterface {
    /**
     * Construct an SPI display interface
     */
    constructor(
      spibus: spi.SpiBus,
      options?: {
        cs?: gpio.PinId | null;
        dc?: gpio.PinId | null; // null for 3-wire spi mode
        rst?: gpio.PinId | null;
        baudrate?: number; // spi device speed, in Hz. default to 40_000_000
      }
    );

    /**
     * Construct an I2C display interface
     */
    constructor(
      i2cbus: i2c.I2cBus,
      options?: {
        addr?: Byte; // device addr
        dataByte?: Byte; // data byte
      }
    );
  }

  abstract class Display extends Canvas {
    constructor(
      interface: DisplayInterface,
      options?: {
        width?: number;
        height?: number;
        colorMode?: ColorMode;
      }
    );

    readonly name: string;
    readonly id: number;
    readonly width: number;
    readonly height: number;
    readonly colorMode: ColorMode;

    readonly isBusy: boolean;
    readonly shouldUpdate: boolean;

    // update image changes to screen, and show it.
    update(flags?: number): this;

    static startService(): void;
    static setRefreshRate(hz: number): void;
  }

  class St7789 extends Display {}

  class Ssd1306 extends Display {}

  class Ssd1327 extends Display {}

  class Ssd1681 extends Display {
    constructor(
      interface: DisplayInterface,
      options: {
        busy: gpio.PinId;
        colorMode?: "binary" | "gray2"; // default to binary
      }
    );
  }
}

declare module "encdec" {
  /**
   * 将字节数组编码成 base64 字串
   *
   * @param 二进制数据
   * @returns base64编码字串
   */
  function encodeBase64(data: BufferedType | Array<Byte>): string;

  /**
   * 将字节数组编码成 base64 字串
   *
   * @param 二进制数据
   * @returns base64编码字串
   */
  function decodeBase64(b64: string): ArrayBuffer;

  /**
   * 将字串编码成utf8字节数组
   *
   * @param 字串
   * @returns 字节数组, 为字串的utf8编码内容
   */
  function encodeStringToUtf8(s: string): ArrayBuffer;

  /**
   * 将字节数组解码成字串
   *
   * @param 字节数组
   * @returns 解码后的字串。如果解码失败，会抛出错误。
   */
  function decodeUtf8ToString(data: BufferedType | Array<Byte>): string;
}

declare module "fs" {
  import { gpio, spi } from "nodewox";

  function umount(mountPath: string): void;
  function getStorageStatus(mountPath: string): { total: number; used: number };

  ///**
  // * 挂载FLASH数据分区
  // *
  // * @example
  // * ```js
  // * // suppose `storage` is the name of data partition
  // * // file system is mounted to '/'
  // * mountPatition('storage', '/');
  // * ```
  // */
  //function mountPatition(partitionName: string, mountPath: string): void;

  /**
   * 挂载SD存储卡（FAT)
   *
   * @param spiBus SPI总线
   * @param cs CS引脚
   * @param mountPath 挂载路径
   * @param timeout 超时 ms
   */
  function mountSDCard(
    spiBus: spi.SpiBus,
    cs: gpio.PinId | null,
    mountPath: string,
    timeout?: number
  ): Promise<void>;

  /**
   * 文件句柄，用于操作打开的文件。
   */
  interface FileHandle extends Stream {}

  /**
   * Metadata信息
   */
  type Metadata = {
    /**
     * 文件名或子目录名
     */
    name: string;

    /**
     * 是否子目录
     */
    dir: boolean;

    /**
     * 字节数
     */
    length: number;
  };

  /**
   * 获取给定路径的metadata
   *
   * @param path - 路径
   * @returns 路径元信息，如果路径不存在，返回null。
   */
  function metadata(path: string): Promise<Metadata | null>;

  /**
   * 删除指定的路径
   *
   * @param path 文件名，或目录名（目录为空才能删除）
   */
  function remove(path: string): Promise<void>;

  /**
   * 路径重命名
   *
   * @param fromPath 原路径
   * @param toPath 新路径
   */
  function rename(fromPath: string, toPath: string): Promise<void>;

  function readdir(path: string): Promise<Array<Metadata>>;
  function readdirSync(path: string): Array<Metadata>;

  function readFile(path: string): Promise<ArrayBuffer>;
  function readFileSync(path: string): ArrayBuffer;

  /**
   * 打开文件
   *
   * @param path - 文件路径
   * @param mode - 打开模式 r:读, rw:读写
   * @returns 文件句柄
   */
  function open(path: string, mode?: "r" | "rw"): Promise<FileHandle>;
  function openSync(path: string, mode?: "r" | "rw"): FileHandle;

  function existsSync(path: string): boolean;
  function mkdirSync(path: string): void;
  function rmdirSync(path: string): void;
}

declare module "graphics" {
  /**
   * 色彩模式
   */
  type ColorMode =
    | "rgba8888"
    | "rgb888"
    | "rgb565"
    | "gray8"
    | "gray4"
    | "gray2"
    | "binary";

  /**
   * 颜色对象
   */
  class Color {
    constructor(hex: string);
    constructor(r: Byte, g: Byte, b: Byte);
    constructor(r: Byte, g: Byte, b: Byte, a: Byte);
    constructor(bool: boolean);

    hue(): number;
    hue(value: IntRange<0, 361>): this;

    saturation(): number;
    saturation(value: IntRange<0, 101>): this;

    lightness(): number;
    lightness(value: IntRange<0, 101>): this;

    /**
     * 用HSL参数创建颜色对象
     *
     * @param hue 色相 0~360
     * @param saturation 饱和度 0~100
     * @param lightness 亮度 0~100
     */
    static hsl(
      hue: IntRange<0, 361>,
      saturation: IntRange<0, 101>,
      lightness: IntRange<0, 101>
    ): Color;
  }

  /**
   * 颜色值
   */
  type ColorValue =
    | string
    | number
    | [Byte, Byte, Byte]
    | [Byte, Byte, Byte, Byte]
    | BufferedType
    | boolean
    | Color;

  type AlignType = 0 | 1 | 2 | 3;

  // 0 - top, 1 - middle, 2 - bottom
  type VerticalAlignType = 0 | 1 | 2;

  class Rect {
    constructor(left: number, top: number, width: number, height: number);

    left: number;
    top: number;
    width: number;
    height: number;
  }

  /**
   * 图层。可用于绘图。
   */
  class Surface {
    /**
     * 新建图层
     *
     * @param width 宽
     * @param height 高
     * @param colorMode 色彩模式
     */
    constructor(width: number, height: number, colorMode: ColorMode);

    /**
     * 给定数组做为缓存，新建图像
     *
     * @param 缓存数组
     * @param width 宽
     * @param colorMode 色彩模式
     */
    constructor(buffer: BufferedType, width: number, colorMode: ColorMode);

    /**
     * 宽
     */
    readonly width: number;

    /**
     * 高
     */
    readonly height: number;

    /**
     * 色彩模式
     */
    readonly colorMode: ColorMode;

    // for image only
    readonly stride?: number;

    // for sub image only
    readonly sourceSurface?: Surface;
    readonly x?: number;
    readonly y?: number;

    /**
     * 获取图层的Canvas接口对象
     *
     * @remarks
     * 如果图像已经创建过Canvas对象，且这Canvas是活跃的，则不可再重复创建另一个Canvas。
     * 直到现有的Canvas对象被释放，或者调用其 `.finish()` 方法后，本图像才解锁，允许创建新的Canvas。
     *
     * @returns Canvas
     */
    getContext(): Canvas;

    mapRgb(colorMapArray: Array<ColorValue>): void;

    /**
     * 裁剪得到一个新的子图层。如果划定的区域不能裁剪出子图层，返回null。
     */
    crop(x: number, y: number, width: number, height: number): Surface | null;

    /**
     * 从图片数据解码并产生图层
     *
     * @param data: 图片数据
     * @param type: 图片类型
     * @param colorMode: 新建图层的色彩模式。如果缺省，为原图片的色彩模式(例如：png为rgb888,rgba8888或gray8; jpg/tga为rgb888)。提示：转换模式一般用于缩小内存占用；除非目的明确，否则不建议转换为比原图片色彩模式大的模式，不如用缺省。
     */
    static decode(
      data: BufferedType,
      type: "png" | "jpg" | "tga",
      colorMode?: ColorMode
    ): Surface;
  }

  abstract class Canvas {
    readonly width: number;
    readonly height: number;
    readonly colorMode: ColorMode;

    dirtyRects: Array<Rect> | null;

    save(): this;
    restore(): this;

    orientation(angle: 0 | 90 | 180 | 270): this;

    lineWidth(width: number): this;

    fillColor(val: number | string): this;
    fillColor(r: Byte, g: Byte, b: Byte, a?: Byte): this;

    strokeColor(val: number | string): this;
    strokeColor(r: Byte, g: Byte, b: Byte, a?: Byte): this;

    backgroundColor(val: number | string): this;
    backgroundColor(r: Byte, g: Byte, b: Byte, a?: Byte): this;

    fillRect(x: number, y: number, width: number, height: number): this;

    strokeRect(x: number, y: number, width: number, height: number): this;

    clearRect(x: number, y: number, width: number, height: number): this;

    beginPath(): this;
    closePath(): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      ccw?: boolean
    ): this;

    stroke(): this;
    fill(): this;

    drawPixel(x: number, y: number, color: ColorValue): this;

    drawSurface(surface: Surface, destX: number, destY: number): this;
    drawSurface(
      surface: Surface,
      srcX: number,
      srcY: number,
      srcWidth: number,
      srcHeight: number,
      destX: number,
      destY: number
    ): this;

    setFont(fontName: string): this;

    /**
     * 设置等宽点阵字体(iso-8859-1)。
     *
     * @param 字体名
     */
    monoFont(name: "4X6" | "5X8" | "7X13"): this;

    drawText(
      text: string,
      options: {
        x: number;
        y: number;
        align?: AlignType;
        verticalPosition?: "baseline" | "top" | "bottom" | "center";
        color?: ColorValue;
        backgroundColor?: ColorValue;
      }
    ): Rect | null;

    drawMonoText(
      text: string,
      options?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        align?: AlignType;
        valign?: VerticalAlignType;
        color?: ColorValue;
      }
    ): this;

    /**
     * 标记发生更新的区域
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    invalidate(x: number, y: number, width: number, height: number): this;

    clearDirtyRects(): this;

    // when canvas operation is complete, call finish() to realse image object.
    // the canvas context will be invalide after calling this.
    finish(): void;
  }

  function addU8g2Font(fontName: string, fontData: BufferedType): void;
  function removeU8g2Font(fontName: string): void;
  function getU8g2FontNames(): Array<string>;
}

declare module "http" {
  type HttpMethod = "get" | "post" | "delete" | "put" | "head";

  //
  // CLIENT
  //

  /*
  interface HttpClient {
    readonly opened: boolean;

    request(method: HttpMethod, url: string): Promise<HttpClientResponse>;

    // close connection
    close(): this;
  }
  */

  /**
   * Http客户端请求得到的响应
   */
  interface HttpClientResponse extends ReadStream, CloseStream {
    readonly status: number;
    readonly contengLength: number | null;
    readonly contentType: string | null;
    readonly headers: Map<string, string>;
    readonly completed: boolean;
  }

  /**
   * 发起一次http请求
   *
   * @returns 响应对象
   */
  export function request(
    method: HttpMethod,
    url: string
  ): Promise<HttpClientResponse>;

  /**
   * 发起一次http get请求
   *
   * @returns 响应对象
   */
  export function get(url: string): Promise<HttpClientResponse>;

  //
  // SERVER
  //

  /**
   * HTTPD 请求对象
   */
  interface HttpServerRequest {
    readonly path: string;
    readonly query: string;
    readonly contentLength: number;
    readonly wsUpgraded: boolean;

    /**
     * 连接的 socket fd
     */
    readonly fd: number;

    /**
     * 接收请求数据到缓存
     *
     * @param buffer 数据缓存
     * @returns 实际读取的字节数
     */
    readBodySync(buffer: BufferedType): number;
  }

  /**
   * HTTPD 响应对象
   */
  interface HttpServerResponse {
    /**
     * 设置响应状态
     *
     * @description
     * 如不设置，默认为 200, "OK"
     *
     * @param code HTTP状态, 如200, 404, 500等
     * @param msg 状态消息。如果省略，对于常用状态，用默认文本。
     */
    status(code: number, msg?: string): this;

    /**
     * 设置内容类型。
     *
     * @description
     * 如不设置，默认为 text/html
     *
     * @param contentType MIME类型
     */
    contentType(contentType: string): this;

    /**
     * 设置内容字节长度。
     *
     * @description
     * 关于此设置对数据传输的关系，请阅读 send() 方法说明。
     *
     * @param length 大等于0的整数
     */
    contentLength(length: number): this;

    /**
     * 添加响应头
     *
     * @description
     * 一些特殊的头: content-length, content-type，请用专门的方法设置，用此方法无效。
     *
     * @param name 名称
     * @param value 值
     */
    header(name: string, value: string): this;

    /**
     * 传输数据
     *
     * @description
     * 如果未设置contentLength，用send()发送时，数据按 chuncked 分块编码传输；
     * 如果设置了contentLength，用send()发送时，数据透明地传输到对方；
     * 如果之前已经开始了chuncked分块传输，则后续一直要用send分块传输，再设置contentLength无效。
     *
     * @param 要发送的数据
     */
    send(data: BufferedType | string | Array<Byte>): this;

    /**
     * 响应结束
     *
     * @description
     * 如提供数据，则在结束前发送此数据。如果设置了结束回调，结束后调用此通知函数。
     *
     * @param data 结束前传输的数据。如果之前是chunked模式传输，则此数据还是以chunked模式传输，最后再附加一个空chunk表示数据完毕；如果不是chunked模式，且未设置content-length，则以此数据长度作为content-length。
     */
    end(data?: BufferedType | string | Array<Byte>): this;
  }

  /**
   * HTTD Websocket 连接对象
   */
  interface HttpServerWsConnection {
    /**
     * socket fd
     */
    readonly fd: number;

    /**
     * 发送数据到对方
     *
     * @param data 数据
     */
    send(data: string): this;

    sendClose(): this;
  }

  /**
   * HTTPD 服务处理函数，可以为普通函数，或异步函数（如果内部处理逻辑需用到异步api await）
   */
  type HttpdHandlerCallback = (
    req: HttpServerRequest,
    res: HttpServerResponse
  ) => void | Promise<void>;

  /**
   * Http服务器对象
   */
  class HttpServer {
    constructor(options?: { stackSize?: number; ctrlPort?: number });

    /**
     * 服务器是否正在运行?
     */
    readonly running: boolean;

    /**
     * 此服务器的控制端口
     */
    ctrlPort: number;

    /**
     * 添加HTTP GET方法路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param handler 处理函数，可以异步函数。
     */
    get(path: string, handler: HttpdHandlerCallback): this;

    /**
     * 添加HTTP POST方法路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param handler 服务处理函数
     */
    post(path: string, handler: HttpdHandlerCallback): this;

    /**
     * 添加HTTP DELEET方法路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param handler 服务处理函数
     */
    delete(path: string, handler: HttpdHandlerCallback): this;

    /**
     * 添加HTTP PUT方法路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param handler 服务处理函数
     */
    put(path: string, handler: HttpdHandlerCallback): this;

    /**
     * 添加HTTP HEAD方法路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param handler 服务处理函数
     */
    head(path: string, handler: HttpdHandlerCallback): this;

    /**
     * 添加 Websocket 路由入口
     *
     * @param path 路径，支持 * 通配符。
     * @param options.onConnect 有客户端连接时的回调函数
     * @param options.onMessage 收到客户端数据的回调函数
     * @param options.onDisconnect 客户端断开连接的回调函数
     */
    ws(
      path: string,
      options: {
        onConnect?: (conn: HttpServerWsConnection) => void;
        onMessage?: (
          conn: HttpServerWsConnection,
          data: ArrayBuffer | String,
          final: boolean
        ) => void;
        onDisconnect?: (conn: HttpServerWsConnection) => void;
      }
    ): this;

    /**
     * 监听指定端口，运行http服务器
     *
     * @param port
     */
    listen(port: number): this;

    /**
     * 停止http服务器
     */
    stop(): Promise<this>;
  }
}

declare module "math" {
  /**
   * 常数 pi
   */
  const PI = 3.141592653589793;

  /**
   * 绝对值
   * @param n 数字
   */
  export function abs(n: number): number;

  /**
   * 取最小数
   * @param n 一组数字
   * @returns 其中最小数字
   */
  export function min(...n: number[]): number;

  /**
   * 取最大数
   * @param n 一组数字
   * @returns 其中最大数字
   */
  export function max(...n: number[]): number;

  export function floor(n: number): number;
  export function ceil(n: number): number;
  export function trunc(n: number): number;
  export function round(n: number): number;

  export function pow(base: number, exp: number): number;

  export function sin(a: number): number;
  export function cos(a: number): number;
  export function tan(a: number): number;
}

declare module "net" {
  /**
   * TCP客户端，通过 socket 连接到TCP服务。
   *
   * @example
   * ```js
   * import {connect} from 'net';
   *
   * // ... suppose this is in an async function ...
   *
   * try {
   *     const sock = await connect("192.168.0.3:4000");
   *     console.log(`connected. remoteAddr=${sock.remoteAddress}, remotePort=${sock.remotePort}`);
   *
   *     const data = new ArrayBuffer(256);
   *
   *     // ... prepare sending data ...
   *
   *     // send bytes to server
   *     await sock.write(data);
   *
   *     // read from server, reuse the buffer, should recv.buffer===data
   *     const recv = await sock.read(data);
   *     console.info(`received data: ${recv.buffer}, ${recv.bufer===data}, ${recv.bytesRead}`);
   *
   *     // read at most 1024 bytes from server
   *     const recv2 = await sock.read(1024);
   *     console.info(`received data: ${recv2.buffer}, actual length: ${recv2.bytesRead}`);
   *
   *     // close the socket
   *     await sock.close();
   * } catch(e) {
   *     console.error(e);
   * }
   * ```
   */
  interface TcpClient extends Stream {
    readonly remoteAddress: string;
    readonly remotePort: number;
    readonly localAddress: string;
    readonly localPort: number;
  }

  /**
   * 连接到远程主机
   *
   * @returns Promise<TcpClient>
   */
  function connect(addr: string): Promise<TcpClient>;

  /**
   * 从网络获取当前时间。
   *
   * @example
   * ```js
   * // customized options
   * await ntp({
   *   server: "cn.ntp.org.cn",
   *   interval: 2000,
   *   retries: 10
   * });
   *
   * // use default options
   * await ntp();
   * ```
   *
   * @param options.server - 服务器地址，如不指定，默认 pool.ntp.org
   * @param options.retries - 重试次数，默认15
   * @param options.interval - 两次重试的间隔时间, 毫秒数。默认 2000ms
   * @param options.smoothAdjust - 是否平滑修正时间?
   */
  function ntp(options?: {
    server?: string | string[];
    retries?: Byte;
    interval?: number;
    smoothAdjust?: boolean;
  }): Promise<void>;
}

declare module "nodewox" {
  function random(buf: BufferedType): void;

  namespace gpio {
    /**
     * Gpio引脚编号
     */
    type PinId = Byte;

    /**
     *  Gpio方向
     *
     *  in=输入,out=输出,inout=输入输出,od=开漏输出,iod=开漏输出+输入
     */
    type GpioDirection = "in" | "out" | "inout" | "od" | "iod";

    /**
     * GPIO电阻模式
     */
    type GpioPullMode = "up" | "down" | "none";

    /**
     * gpio配置参数
     */
    type GpioOpenOptions = {
      /**
       * 电阻模式，默认为none
       */
      pull?: GpioPullMode;
      /**
       * 驱动能力
       */
      drive?: 0 | 1 | 2 | 3;
    };

    /**
     * 打开引脚，用于逻辑电平(0/1)输入输出。
     *
     * @param pin 引脚编号
     * @param mode 方向
     * @param options
     */
    function open(
      pin: PinId,
      mode: GpioDirection,
      options?: GpioOpenOptions
    ): GpioHandle;

    /**
     * gpio脉冲发生器参数
     */
    type GpioPulseOptions = {
      clockHz: number;
      bitTiming?: [number, number, number, number];
    };

    /**
     * 打开引脚，用于脉冲信号输入输出。
     *
     * @param pin 引脚编号
     * @param mode 为"pulse"，表示脉冲模式
     * @param options
     */
    function open(
      pin: PinId,
      mode: "pulse",
      options: GpioOpenOptions | GpioPulseOptions
    ): PulseHandle;

    function handle(pin: PinId): GpioHandle | null;

    /**
     * Gpio操控句柄
     *
     * @description
     * 用 gpio.open() 打开gpio后，可返回次gpio的控制句柄。或者用 gpio.handle() 获取gpio当前的操控句柄。
     */
    interface GpioHandle {
      /**
       * 引脚编号
       */
      readonly id: PinId;

      /**
       * 获取引脚方向
       */
      direction(): GpioDirection | null;

      /**
       * 更改引脚方向
       */
      direction(d: GpioDirection): this;

      /**
       * 读引脚当前电平。true=高电平，false=低电平。
       */
      value(): boolean;

      /**
       * 引脚输出电平。true=高电平，false=低电平。
       */
      value(b: boolean): this;

      /**
       * 引脚输出能力。
       */
      drive(): 0 | 1 | 2 | 3;

      /**
       * 设置引脚输出能力。
       */
      drive(n: 0 | 1 | 2 | 3): this;

      /**
       * 设置引脚电阻模式
       *
       * @param 电阻模式
       */
      pull(mode: GpioPullMode): this;

      /**
       * 设置引脚中断处理。
       *
       * @param handler 中断回调函数。null表示关闭中断。
       * @param trigger 中断触发类型
       * @param options.trigger 中断触发类型, rising=上升沿, falling=下降沿, both=上升/下降沿, low=低电平, high=高电平. 默认为 both.
       * @param options.debounce 防抖动时间，以毫秒计。默认为0
       */
      irq(
        handler: (level: boolean) => void | null,
        options?: {
          trigger?: "both" | "rising" | "falling" | "low" | "high";
          debounce?: number;
        }
      ): this;

      /**
       *
       * @experimental
       *
       * 为已打开的引脚配置脉冲信号发生，从该引脚输出脉冲信号。
       */
      // pulse(options: gpio.GpioPulseOptions): PulseHandle;
    }
  }

  namespace i2c {
    /**
     * I2C控制器ID
     */
    type I2cId = 0 | 1;

    /**
     * 以master模式打开I2C控制器，建立I2C总线，返回总线对象。
     *
     * @param id i2c控制器ID
     * @param scl SCL引脚号
     * @param sda SDA引脚号
     * @param options.baudrate 总线速度，默认400_000Hz
     * @param options.timeout 超时时间，以毫秒计。默认50ms
     * @param options.sclPullUp SCL引脚是开启上拉电阻，默认true
     * @param options.sdaPullUp SDA引脚是开启上拉电阻，默认true
     *
     * @returns I2cBus 对象
     */
    function open(
      id: I2cId,
      scl: gpio.PinId,
      sda: gpio.PinId,
      options?: {
        baudrate?: number;
        timeout?: number;
        sclPullUp?: boolean;
        sdaPullUp?: boolean;
      }
    ): I2cBus;

    /**
     * 获取指定控制器上当前打开的总线，如果控制器没有打开，返回null。
     * @param id
     */
    function handle(id: I2cId): I2cBus | null;

    /**
     * I2C总线，工作于master模式。
     */
    interface I2cBus {
      /**
       * 向指定地址写数据，同步阻塞。
       *
       * @param addr 地址
       * @param bytes 要写的数据
       */
      writeToSync(
        addr: Byte,
        bytes: BufferedType | Array<Byte> | String | Byte
      ): this;

      /**
       * 从指定地址读数据，同步阻塞。
       *
       * @param addr 地址
       * @param buffer 缓存
       */
      readFromSync(addr: Byte, buffer: BufferedType): this;

      /**
       * 向指定地址写数据，再从该地址读数据，同步阻塞。
       *
       * @param addr 地址
       * @param bytes 写数据
       * @param buffer 读数据
       */
      writeReadSync(
        addr: Byte,
        bytes: BufferedType | Array<Byte> | String | Byte,
        buffer: BufferedType
      ): this;

      /**
       * 探测I2C总线上连接的从设备地址
       *
       * @returns I2C从设备的地址数组
       */
      detectSync(): Array<Byte>;
    }
  }

  namespace i2s {
    /**
     * I2S写通道，用于向I2S通道写数据，发送到设备。
     */
    interface I2sWriter
      extends EventEmitter<{
        /**
         * 未发送数据量小于设定的最低阈值
         */
        "data-low": [number];
        /**
         * 没有待发送数据
         */
        "data-empty": [];
      }> {
      /**
       * 通道是否启用。
       */
      readonly running: boolean;

      /**
       * 数据缓冲中当前存在的字节数
       */
      readonly bufferLength: number;

      /**
       * 开始
       */
      start(): this;

      /**
       * 停止
       *
       * @remarks
       * 对于发送数据通道，如果当前正在发送数据，停止意味着终止发送，但是未完毕的数据和位置保留，待下次启用 start() 时继续。
       * 如果通道已经停止，则没有影响。
       */
      stop(): this;

      /**
       * 设置缓存数据量下限阈值
       *
       * @param level 阈值字节数
       */
      threshould(level: number): this;

      /**
       * 将数据复制部分到输出缓存，返回实际写入的字节数。
       *
       * @description
       * 调用 .start() 方法启动执行后，才开始播放，否则数据只是写入缓冲区，实际并没有播放。
       * 至于 start() 和写数据孰先孰后，均可。
       *
       * @param data 数据对象
       * @returns 实际写入的字节数
       */
      writeSync(data: BufferedType): number;

      /**
       * 异步将数据写入发送缓存，全部写入后resolve.
       * @fixme: this will panic.
       *
       * @description
       * 将数据全部写入发送缓存，直到所有数据都写入完毕。
       * 如果缓存满而无泻出途径，则会导致背地写入一直阻塞而无进展。
       *
       * @param - 数据对象
       */
      writeAll(data: BufferedType): Promise<void>;
    }

    /**
     * I2S读通道，用于从I2S通道读数据。
     */
    interface I2sReader
      extends EventEmitter<{
        overflow: [number];
        data: [ArrayBuffer];
      }> {
      /**
       * 通道是否启用。
       */
      readonly isRunning: boolean;

      /**
       * 数据缓冲中当前存在的字节数
       */
      readonly bufferLength: number;

      /**
       * 开始
       */
      start(): this;

      /**
       * 停止
       *
       * @remarks
       * 对于发送数据通道，如果当前正在发送数据，停止意味着终止发送，但是未完毕的数据和位置保留，待下次启用 start() 时继续。
       * 如果通道已经停止，则没有影响。
       */
      stop(): this;
    }

    /**
     * 通道打开模式，in=输入(例如获取麦克风数据), out=输出(例如播放), inout=输入输出
     */
    type I2sMode = "in" | "out" | "inout";

    /**
     * 打开I2S通道，返回I2S [写, 读]通道控制句柄。
     *
     * @param mode - 通道模式
     * @param options.bitWidth - 数据位宽，默认 16
     * @param options.sampleRate - 采样率Hz, 默认 44100
     * @param options.bitShift - 正式数据开始前是否有一个空比特位(即:Philip格式)，默认 true
     * @param options.mono - 是否其单声道，默认 false
     * @param options.bufferSize - 数据缓冲区字节数，默认为100KB
     * @param options.mclk - MCLK (master clock)引脚
     * @param options.bclk - BCLK (bit clock)引脚
     * @param options.ws - WS (word select)引脚，有时也叫LRCK
     * @param options.dout - DOUT引脚，数据输出
     * @param options.din - DIN引脚，数据输入
     *
     * @returns I2S [写, 读]通道句柄
     */
    function open(
      mode: I2sMode,
      options: {
        bitWidth: 16 | 24 | 32;
        sampleRate?: number;
        bitShift?: boolean;
        mono?: boolean;
        bufferSize?: number;
        mclk: gpio.PinId | null;
        bclk: gpio.PinId | null;
        ws: gpio.PinId | null;
        din: gpio.PinId | null;
        dout: gpio.PinId | null;
      }
    ): [I2sWriter | null, I2sReader | null];
  }

  /**
   *  脉冲发生器句柄
   */
  interface PulseHandle {
    /**
     * 计数频率。
     *
     * @description
     * 此频率决定每节拍的单位时间，即最小时长分辨率。
     */
    clockHz: number;

    /**
     * 表示1/0比特的脉冲。
     *
     * @description
     * 数组中前两个元素表示比特0的脉冲：高电平时长(ns)和低电平时长(ns)；
     * 数组中后两个元素表示比特1的脉冲：高电平时长(ns)和低电平时长(ns)；
     */
    bitTiming: [number, number, number, number];

    /**
     * 将字节数据从高位到低位产生脉冲信号。
     *
     * @description
     * 使用本方法前，确保已设置0/1对应的脉冲模式。全部数据脉冲发送完毕后，此方法才返回。
     */
    writeBitstreamSync(bytes: BufferedType | Array<Byte>): this;

    writeTimeSeriesSync(
      sequence: BufferedType | Array<Byte>,
      startLevel?: 0 | 1
    ): this;
  }

  namespace spi {
    /**
     * SPI控制器ID
     */
    type SpiPortId = 1 | 2 | 3;

    /**
     * 打开SPI控制器，建立SPI总线
     *
     * @param portId SPI控制器ID
     * @param sclk 用于SCLK的引脚编号
     * @param mosi 用于MOSI的引脚编号
     * @param miso 用于MISO的引脚编号
     * @param dma DMA缓存大小, 0表示不启用
     * @returns SPI总线对象
     */
    function open(
      portId: SpiPortId,
      sclk: gpio.PinId,
      mosi: gpio.PinId | null,
      miso: gpio.PinId | null,
      dma?: 0 | 1024 | 2048 | 4096
    ): SpiBus;

    /**
     * 获取SPI控制器当前建立的总线。如果控制器还未打开，返回null
     * @param portId SPI控制器ID
     */
    function handle(portId: SpiPortId): SpiBus | null;

    /**
     * SPI总线
     *
     * @remarks
     * 通过SPI控制器 `open()` 方法打开并建立，返回SPI总线对象。也可通过SPI控制器的 `handle()` 方法获取指定控制器上已打开的总线。
     */
    interface SpiBus {
      /**
       * SPI控制器ID
       */
      readonly id: SpiPortId;

      /**
       * 在SPI总线上添加一个设备
       *
       */
      addDevice(options: {
        cs?: gpio.PinId | null;
        baudrate?: number;
        writeOnly?: boolean;

        // 0: CPOL = 0, CPHA = 0 (default)
        // 1: CPOL = 0, CPHA = 1
        // 2: CPOL = 1, CPHA = 0
        // 3: CPOL = 1, CPHA = 1
        mode?: 0 | 1 | 2 | 3;
      }): SpiDevice;
    }

    /**
     * SPI设备
     */
    interface SpiDevice {
      /**
       * 所在SPI控制器ID
       */
      readonly id: SpiPortId;

      /**
       * 将数据写到设备，同步执行。阻塞，直到操作完成。
       *
       * @param data 要写入的数据
       */
      writeSync(data: BufferedType | String | number): this;

      /**
       * 将数据写到设备，异步执行。立即返回，操作完成通过Promise反馈。
       *
       * @param data 要写入的数据
       */
      write(data: BufferedType): Promise<void>;

      //write(options: {
      //  data: BufferedType;
      //  preGpio: gpio;
      //  preGpioValue: boolean;
      //}): Promise<void>;
    }
  }

  /**
   * 硬件定时器
   */
  abstract class Timer {
    /**
     * 取消定时任务
     */
    cancel(): void;

    /**
     * 创建仅触发一次的定时任务。
     *
     * @param callback - 回调任务函数
     * @param after - 定时时间，ms
     */
    static once(callback: Function, after: number): Timer;

    /**
     * 创建周期触发的定时任务。
     *
     * @param callback - 回调任务函数
     * @param period - 定时周期，ms
     */
    static every(callback: Function, period: number): Timer;
  }

  /**
   * 获取当前时间戳
   *
   * @returns 自系统启动以来的到现在经过的时间(以 us 计)。
   */
  function timestamp(): number;

  /**
   * 阻塞运行一段时间(以ms计)
   */
  function wait(ms: number): void;

  /**
   * 阻塞运行一段时间(以us计)
   */
  function waitUs(us: number): void;

  type AuthMethodType =
    | "wep"
    | "wpa"
    | "wpa2personal"
    | "wpawpa2personal"
    | "wpa2enterprise"
    | "wpa3personal"
    | "wpa2wpa3personal"
    | "wapipersonal";

  type IpInfo = {
    ip: string;
    gateway: string;
    mask: string;
    dns: string | null;
    dns2: string | null;
  };

  /**
   * WIFI状态码定义
   */
  enum WifiStatus {
    STA_STARTED = 2,
    STA_STOPPED = 3,
    STA_CONNECTED = 4,
    STA_DISCONNECTED = 5,
    AP_STARTED = 12,
    AP_STOPPED = 13,
    AP_CONNECTED = 14,
    AP_DISCONNECTED = 15,
  }

  /**
   * 热点(Access Point)信息
   */
  type ApInfo = {
    ssid: string;
    bssid: ArrayBuffer;
    channel: number;
    signalStrength: number;
    authMethod: number;
  };

  /**
   * Wifi操控句柄
   *
   * @description
   * 通过 Wifi.open() 开启无线电以获得之，用于操控 Wifi。
   */

  interface WifiHandle
    extends EventEmitter<{
      "state-change": [WifiStatus];
      "ip-assigned": [string | null];
    }> {
    /**
     * STA模式的MAC地址
     */
    readonly staMac: string;

    /**
     * STA模式配置。null表示未启用STA模式。
     */
    readonly staConfig: {
      ssid: string;
      authMethod: AuthMethodType | null;
    } | null;

    /**
     * STA模式状态
     */
    readonly staStatus: WifiStatus;

    readonly staStarted: boolean;

    /**
     * STA模式下获取的IP地址信息
     */
    readonly staIp: IpInfo | null;

    /**
     * AP模式的MAC地址
     */
    readonly apMac: string;

    /**
     * AP模式配置。null表示未启用AP模式。
     */
    readonly apConfig: {
      ssid: string;
      authMethod: AuthMethodType | null;
    } | null;

    /**
     * 配置WIFI工作模式
     *
     * @param sta 配置STA模式。null表示不启用STA模式
     * @param ap  配置AP模式。null表示不启用AP模式
     */
    config(
      sta: {
        ssid: string;
        password: string;
        authMethod?: AuthMethodType | null;
      } | null,
      ap: {
        ssid: string;
        password?: string;
        authMethod?: AuthMethodType | null;
      } | null
    ): this;

    start(): this;
    stop(): this;
    connect(): this;
    disconnect(): this;
    scan(): Promise<Array<ApInfo>>;
  }

  /**
   * WIFI管理
   */
  interface WifiManager {
    /**
     * 当前Wifi是否已开启.
     */
    readonly opened: boolean;

    /**
     * 打开 Wifi。
     *
     *
     * @description
     * 开启Wifi无线电。
     * 如果Wifi已经打开，则返回现有的句柄对象；如果还未开启，则初始化Wifi无线电，创建操控句柄，并返回之。
     *
     * @returns Wifi设备句柄
     */
    open(): WifiHandle;

    /**
     * 关闭Wifi。
     *
     * @description
     * 停用 Wifi 设备。
     * 如果当前存在 WifiHandle 对象引用，则无法关闭，须先释放 WifiHandle 对象方可。
     */
    close(): void;
  }

  /**
   * Wifi 设备控制器
   */
  const Wifi: WifiManager;
}

declare module "sys" {
  const arch: string;

  const platform: string;

  const buildInfo: {
    version: string;
    type: string;
    timestamp: string;
    branch: string;
    revision: string;
  };

  /**
   * 将JS值导出为二进制字节码
   *
   * @param value JS值
   * @returns ArrayBuffer
   */
  function dump(value: any): ArrayBuffer;

  /**
   * 载入二进制字节码还原为JS值
   *
   * @param value 字节码
   * @returns JS值
   */
  function load(value: BufferedType): any;

  /**
   * 设置系统时间
   *
   * @param 自从UNIX EPOCH以来的秒数。小数部分为毫秒。
   */
  function time(secs: number): void;

  /**
   * 返回系统时间
   *
   * @returns 自从UNIX EPOCH以来的秒数。小数部分为毫秒。
   */
  function time(): number;

  /**
   * 返回CPU工作频率
   */
  function cpuFreq(): number;

  /**
   * 获取内存使用情况
   */
  function mem(): {
    exTotal: number;
    inTotal: number;
    exFree: number;
    inFree: number;
  };

  /**
   * 重置js环境
   */
  function restart(): void;

  /**
   * 硬重启
   */
  function reboot(): void;
}

declare module "usb" {
  type UsbDeviceInterface =
    | "cdc-acm"
    | "msc"
    | {
        type: "cdc-acm";
        onData: ((data: Uint8Array, tx: WriteStream) => void) | null;
      }
    | { type: "msc"; storage?: "flash" };

  /**
   * USB设备
   */
  interface UsbDevice {
    readonly opened: boolean;
    readonly isSuspended: boolean;

    open(
      interface: UsbDeviceInterface | Array<UsbDeviceInterface>,
      options?: {
        vendorId?: number;
        productId?: number;
        manufacturerName?: string;
        productName?: string;
        serialNumber?: string;
        remoteWakeup?: boolean;
        selfPowered?: boolean;
      }
    ): void;

    close(): void;

    remoteWakeup(): boolean;
    disconnect(): boolean;
    connect(): boolean;

    getHandle(type: "cdc-acm"): WriteStream | null;
  }

  /**
   * USB设备管理器
   */
  const USB: UsbDevice;
}
