import { HttpServer } from "http";
import * as fs from "fs";

// base path for file server urls
const STORAGE_BASE_PATH: string = "/storage";

export function setupFileService(server: HttpServer) {
  server
    .get(`${STORAGE_BASE_PATH}/*`, async (req, res) => {
      const pathInfo = req.path.substring(STORAGE_BASE_PATH.length);

      try {
        if (pathInfo.endsWith("/")) {
          // is a dir, return dir entries
          const entries = await fs.readdir(pathInfo);
          const result = entries.map((meta) => ({
            name: meta.name,
            dir: meta.dir,
            length: meta.length,
          }));

          res.send(JSON.stringify(result));
        } else {
          // is a filename, send file binary
          console.log(`*** open ${pathInfo}`);

          const fp = await fs.open(pathInfo);
          const buf = new Uint8Array(256);

          while (1) {
            const n = await fp.read(buf);
            if (n > 0) {
              res.send(buf.subarray(0, n));
            } else {
              // end of data
              res.end();
              break;
            }
          }
        }
      } catch (e) {
        console.error(`${e}`);
        //res.send("ERROR");
        //res.end();
        throw e;
      }
    })
    .post(`${STORAGE_BASE_PATH}/*`, async (req, res) => {
      const pathInfo = req.path.substring(STORAGE_BASE_PATH.length);

      if (pathInfo === "" || pathInfo.endsWith("/")) {
        //res.status="505 invalid filename";
        throw new Error("Invalid filename");
      } else if (req.contentLength > 4 * 1024 * 1024) {
        //throw new Error("File too large");
        res.end("file too large");
      } else {
        const override = true; // to get override param from query string
        let remaining = req.contentLength;

        let saveFile = pathInfo;
        const exists = !!(await fs.metadata(pathInfo));
        if (exists) {
          if (!override) {
            throw new Error("file name already exists");
          }

          // find a temp file name
          let n = 1;
          while (1) {
            const fname = `${pathInfo}.tmp${n}`;
            console.log(`check tmp: ${fname}`);

            if (await fs.metadata(fname)) {
              n++;
            } else {
              saveFile = fname;
              break;
            }
          }
        }

        let fp;
        try {
          fp = await fs.open(saveFile, "rw");
        } catch (e) {
          console.log("open file fail");
          throw e;
        }

        const buf = new Uint8Array(512);

        while (remaining > 0) {
          let n = req.readBodySync(buf);
          console.log(`got nbytes=${n}, remaining=${remaining}`);

          if (n === 0) {
            break;
          } else {
            await fp.write(buf.subarray(0, n));
            remaining -= n;
          }
        }

        fp.close();

        if (saveFile !== pathInfo) {
          // rename file
          console.log(`rename file ${saveFile} -> ${pathInfo}`);
          await fs.rename(saveFile, pathInfo);
        }

        res.end("OK");
      }
    })
    .delete(`${STORAGE_BASE_PATH}/*`, async (req, res) => {
      const pathInfo = req.path.substring(STORAGE_BASE_PATH.length);

      if (pathInfo === "" || pathInfo.endsWith("/")) {
        throw new Error("Invalid filename");
      }

      await fs.remove(pathInfo);
      res.end("OK");
    });
}
