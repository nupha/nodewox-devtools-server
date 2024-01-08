// keep this line to ensure nodewox dts package is enabled
import {} from "nodewox";

import { HttpServer, HttpServerWsConnection } from "http";
import { setupFileService } from "./file-svc";
import {
  makeExceptionDetails,
  makeRemoteObject,
  objCache,
  resetObjCache,
} from "./remote-object";

let server: HttpServer | null = null;
let connection: HttpServerWsConnection | null = null;

const globalEval = eval.bind(globalThis);

function getPropertiesOf(
  target: any,
  group: string | null,
  isOwn = true
): Array<{ [key: string]: any }> {
  const props: Array<{ [key: string]: any }> = [];

  // own properties
  Object.entries(Object.getOwnPropertyDescriptors(target)).forEach(
    (kv: [string | symbol, any]) => {
      const key: string | symbol = kv[0];
      const desc = kv[1];

      const pd = {
        name: key.toString(),
        enumerable: desc.enumerable,
        configurable: desc.configurable,
        isOwn,

        value:
          desc.value !== undefined
            ? makeRemoteObject(desc.value, group)
            : undefined,
        get:
          desc.get !== undefined
            ? makeRemoteObject(desc.get, group)
            : undefined,
        set:
          desc.set !== undefined
            ? makeRemoteObject(desc.set, group)
            : undefined,
      };

      props.push(pd);
    }
  );

  // inhrited properties from prototype
  const proto = target ? Object.getPrototypeOf(target) : null;
  if (proto) {
    for (const p of getPropertiesOf(proto, group, false)) {
      props.push(p);
    }

    /*
    props.push({
      name: "__proto__",
      value: makeRemoteObject(proto, group),
    });
    */
  }

  return props;
}

function send(msg: any) {
  if (connection) {
    connection.send(JSON.stringify(msg));
  }
}

function sendResult(result: any, id?: number) {
  const msg: any = { result };
  id && (msg.id = id);
  send(msg);
}

function runtimeEnable() {
  const ctxAck = {
    method: "Runtime.executionContextCreated",
    params: {
      context: {
        id: "0",
        origin: "",
        name: "nodewox",
        uniqueId: "0",
        auxData: { isDefault: true },
      },
    },
  };
  send(ctxAck);
}

function runtimeEvaluate(event: any) {
  let val: any;
  try {
    val = globalEval(event.params.expression);
    if (event.params.throwOnSideEffect) {
      if (val instanceof Promise) {
        throw new Error("Possible side effect");
      }
    }
  } catch (e) {
    val = e;
  }

  sendResult(
    {
      result: makeRemoteObject(val, event.params.objectGroup || null),
      exceptionDetails:
        val instanceof Error ? makeExceptionDetails(val) : undefined,
    },
    event.id
  );
}

function runtimeGetExceptionDetails(objId: string, msgId: number): void {
  const ex = objCache[objId];
  if (ex) {
    const o = makeExceptionDetails(ex);
    sendResult(o ? { exceptionDetails: o } : {}, msgId);
  }
}

function runtimeCallFunctionOn(event: any): void {
  let result: any;
  const target = objCache[event.params.objectId];

  if (target) {
    let args = event.params.arguments.map(
      (a: { objectId: string }) => objCache[a.objectId]?.value
    );
    if (!args.find((a: any) => a === undefined)) {
      const f = eval(`(${event.params.functionDeclaration})`);
      try {
        result = f.apply(target.value, args);
      } catch (e) {
        result = e;
      }
    } else {
      result = new EvalError("argument object is missing");
    }
  } else {
    result = new EvalError("target object is missing");
  }

  sendResult(
    {
      result: makeRemoteObject(result, target.group),
      exceptionDefails:
        result instanceof Error ? makeExceptionDetails(result) : undefined,
    },
    event.id
  );
}

function processEvent(event: any): void {
  switch (event.method) {
    // nodewox only
    case "eval":
      if (event.content) {
        try {
          // eval expr in global context
          const v = globalEval(event.content);
          console.log(v);
          if (connection) {
            connection.send(`${v}`);
          }
        } catch (e) {
          console.error(e);
        }
      }
      break;

    case "Runtime.enable":
      runtimeEnable();
      sendResult({}, event.id);
      break;

    case "Runtime.evaluate":
      //setTimeout(() => runtimeEvaluate(event), 0);
      runtimeEvaluate(event);
      break;

    case "Runtime.compileScript":
      /*
      try {
        const bc = compile(event.params.expression, event.params.sourceURL);
        const oid = `${objId}`;
        objId++;
        objCache[oid] = bc;
        const msg = {
          method: "Debugger.scriptParsed",
          params: {
            scriptId: oid,
            url: "",
            startLine: 0,
            startColumn: 0,
            endLine: 0,
            endColumn: 0,
            executionContextId: "0",
            hash: "0000000000",
            executionContextAuxData: { isDefault: true },
            isLiveEdit: false,
            sourceMapURL: "",
            hasSourceURL: false,
            isModule: false,
            length: event.params.expression.length,
            scriptLanguage: "Javascript",
            embedderName: "",
          },
        };
        send(msg);

        const rep = { id: event.id, result: {} };
        send(rep);
      } catch (e) {
        sendResult({ result: makeRemoteObject(e) }, event.id);
      }
      */
      sendResult({}, event.id);
      break;

    case "Runtime.callFunctionOn":
      runtimeCallFunctionOn(event);
      break;

    case "Runtime.globalLexicalScopeNames":
      sendResult({ names: Object.keys(globalThis) }, event.id);
      break;

    case "Runtime.getProperties":
      {
        const go = objCache[event.params.objectId];
        sendResult(
          go ? { result: getPropertiesOf(go.value, go.group) } : {},
          event.id
        );
      }
      break;

    case "Runtime.getExceptionDetails":
      runtimeGetExceptionDetails(event.params.errorObjectId, event.id);
      break;

    case "Runtime.releaseObjectGroup":
      {
        const group = event.params.objectGroup;
        for (const item of Object.entries(objCache).filter((a) => {
          a[1].group === group;
        })) {
          delete objCache[item[0]];
        }
        sendResult({}, event.id);
      }
      break;

    case "Runtime.releaseObject":
      delete objCache[event.params.objectId];
      sendResult({}, event.id);
      break;

    case "Runtime.discardConsoleEntries":
      {
        for (const item of Object.entries(objCache).filter((a) => {
          a[1].group === "console";
        })) {
          delete objCache[item[0]];
        }
        sendResult({}, event.id);
      }
      break;

    default:
      console.print(`unknown event '${event.method}'`);
  }
}

/*
// console handler callback for each socket fd
const consoleHandlers: {
  [id: number]: (level: number, ...args: any[]) => void;
} = {};
*/

// console handler callback
function consoleHandler(level: number, ...args: any[]): void {
  if (connection) {
    let type: string;

    /*
    https://www.howtogeek.com/devops/ways-to-format-console-output-in-javascript/
    Specifier	Output 
    %s	 Formats the value as a string
    %i or %d	 Formats the value as an integer
    %f	 Formats the value as a floating point value
    %o	 Formats the value as an expandable DOM element. As seen in the Elements panel 
    %O	 Formats the value as an expandable JavaScript object
    %c	 Applies CSS style rules to the output string as specified by the second parameter
    */

    switch (level) {
      case 1:
        type = "log";
        break;
      case 2:
        type = "info";
        break;
      case 3:
        type = "warning";
        break;
      case 4:
        type = "error";
        break;
      default:
        type = "log";
    }

    send({
      method: "Runtime.consoleAPICalled",
      params: {
        type,
        args: args.map((v) => makeRemoteObject(v, "console")),
        executionContextId: 0,
        timestamp: 0,
        stackTrace: { callFrames: [] },
      },
    });
  }
}

export function getServer(): HttpServer {
  if (!server) {
    server = new HttpServer({});
    server.ctrlPort = 32767;

    server.ws("/ws", {
      onConnect: (conn) => {
        console.log(`onConnect() for ws ${conn.fd}`);

        // testing: may now send a msg to client.
        // conn.send("DEBUG: HELLO FROM WS");

        if (connection) {
          console.log("already has a ws session");
          connection.sendClose();
        } else {
          connection = conn;

          // send salute message
          send({
            method: "Runtime.consoleAPICalled",
            params: {
              type: "info",
              args: [
                { type: "string", value: "%cWelcome to Nodewox" },
                { type: "string", value: "color:orange;font-size:12pt" },
              ],
              executionContextId: 0,
              timestamp: 0,
              stackTrace: { callFrames: [] },
            },
          });

          // register handler to forward console content
          console.handler = consoleHandler;
        }
      },
      onMessage: (conn, data, fin) => {
        if (typeof data === "string") {
          processEvent(JSON.parse(data));
        }
      },
      onDisconnect: (conn) => {
        console.print(`/ws closed: fd=${conn.fd}`);

        console.handler = null;

        if (connection === conn) {
          connection = null;
        }
      },
    });

    setupFileService(server);
  }

  return server!;
}

export function start() {
  const svr = getServer();
  svr.listen(8181);
}

export function stop() {
  if (server) {
    console.log("stop devtools server");

    server?.stop().then(() => {
      server = null;
    });
  }

  resetObjCache();
}
