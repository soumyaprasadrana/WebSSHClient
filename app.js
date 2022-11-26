/**
 * @author [soumya]
 * @email [soumyaprasad.rana@gmail.com]
 * @create date 2022-11-26 18:08:48
 * @modify date 2022-11-26 18:08:48
 * @desc Entrypoint for the application
 */
const express = require("express");
var pino = require("pino");
var http = require("http");
var SSHClient = require("ssh2").Client;
var utf8 = require("utf8");

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  },
  pino.destination("./server.log")
);
var app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.redirect("/SSHClient");
});
app.use(express.static(__dirname + "/static"));
app.get("/SSHClient", (req, res) => {
  res.sendFile("index.html", { root: __dirname + "/static" });
});

logger.info("Creating http server for socket.io");
var server = http.createServer(app);
logger.info("Registering Socket.io");

//socket.io instantiation
const io = require("socket.io")(server, { origins: "*:*" });

server.listen(port, () => logger.info("App listening on port " + port));

//Socket Connection
io.on("connection", function(socket) {
  try {
    logger.info("SERVER SOCKET CONNECTION CREATED :", socket.id);
    var data = socket.handshake.query;
    logger.info(data);
    if (data.type == "webshell") {
      logger.info("Connection type : webshell");
      var ssh = new SSHClient();
      ssh
        .on("ready", function() {
          socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n\n");
          logger.debug("SSH CONNECTION ESTABLISHED for socket" + socket.id);
          connected = true;
          ssh.shell(function(err, stream) {
            if (err) {
              logger.debug(
                "SSH SHELL ERROR: " + err.message + " for socket" + socket.id
              );
              logger.debug(err);
              return socket.emit(
                "data",
                "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
              );
            }
            socket.on("data", function(data) {
              logger.debug("Socket ID::" + socket.id + " on data ::");
              logger.debug(data);
              stream.write(data);
            });
            stream
              .on("data", function(d) {
                logger.debug(
                  "Socket ID::" + socket.id + " ssh stream on data ::"
                );
                logger.debug(utf8.decode(d.toString("binary")));
                socket.emit("data", utf8.decode(d.toString("binary")));
              })
              .on("close", function() {
                logger.debug(
                  "Socket ID::" +
                    socket.id +
                    " ssh stream on close() :: Going to call ssh.end()"
                );
                ssh.end();
              });
          });
        })
        .on("close", function() {
          logger.debug(
            "Socket ID::" +
              socket.id +
              " ssh on close() :: SSH CONNECTION CLOSED"
          );
          socket.emit("data", "\r\n*** SSH CONNECTION CLOSED ***\r\n");
        })
        .on("error", function(err) {
          logger.debug(err);
          logger.debug(
            "Socket ID::" +
              socket.id +
              " ssh on error ::SSH CONNECTION ERROR: " +
              err.message
          );
          socket.emit(
            "data",
            "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
          );
        })
        .connect({
          host: data.hostname,
          port: data.port, // Generally 22 but some server have diffrent port for security Reson
          username: data.username, // user name
          password: data.password, // Set password or use PrivateKey
          // privateKey: require("fs").readFileSync("PATH OF KEY ") // <---- Uncomment this if you want to use privateKey ( Example : AWS )
        });
    } else if (data.type == "exec") {
      logger.info("Connection type: exec");
      if (
        typeof data.command == "undefined" ||
        data.command == null ||
        data.command == "null"
      ) {
        logger.info(
          "SSH CONNECTION ERROR: Command not found for connection type execute!"
        );
        return socket.emit(
          "data",
          "\r\n*** SSH CONNECTION ERROR: Command not found for connection type execute! ***\r\n"
        );
      }
      var ssh = new SSHClient();
      ssh
        .on("ready", function() {
          socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
          logger.debug("SSH CONNECTION ESTABLISHED for socket" + socket.id);
          connected = true;
          ssh.exec(data.command, function(err, stream) {
            if (err) {
              logger.debug(
                "SSH SHELL ERROR: " + err.message + " for socket" + socket.id
              );
              logger.debug(err);
              return socket.emit(
                "data",
                "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
              );
            }
            socket.on("data", function(data) {
              logger.debug("Socket ID::" + socket.id + "on data::");
              logger.debug(data);
              stream.write(data);
            });
            stream
              .on("data", function(d) {
                logger.debug(
                  "Socket ID::" + socket.id + " ssh stream on data ::"
                );
                logger.debug(utf8.decode(d.toString("binary")));
                socket.emit("data", utf8.decode(d.toString("binary")));
              })
              .stderr.on("data", (d) => {
                logger.debug(
                  "Socket ID::" + socket.id + " ssh error stream on data ::"
                );
                logger.debug(utf8.decode(d.toString("binary")));
                socket.emit("data", utf8.decode(d.toString("binary")));
              })
              .on("error", function(d) {
                logger.debug("Socket ID::" + socket.id + " ssh on eror ::");
                logger.debug(utf8.decode(d.toString("binary")));
                socket.emit("data", utf8.decode(d.toString("binary")));
              })
              .on("close", function() {
                logger.debug(
                  "Socket ID::" +
                    socket.id +
                    " ssh stream on close() :: Going to call ssh.end()"
                );
                ssh.end();
              });
          });
        })
        .on("close", function() {
          logger.debug(
            "Socket ID::" +
              socket.id +
              " ssh on close() :: COMMAND EXECUTED CONNECTION CLOSED"
          );
          socket.emit(
            "data",
            "\r\n*** COMMAND EXECUTED CONNECTION CLOSED ***\r\n"
          );
        })
        .on("error", function(err) {
          logger.debug(err);
          logger.debug(
            "Socket ID::" +
              socket.id +
              " ssh on error ::SSH CONNECTION ERROR: " +
              err.message
          );
          if (err.message.includes("read ECONNRESET")) {
            socket.emit("data", "\r\n*** Stream closed  ***\r\n");
          } else {
            socket.emit(
              "data",
              "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
            );
          }
        })
        .connect({
          host: data.hostname,
          port: data.port, // Generally 22 but some server have diffrent port for security Reson
          username: data.username, // user name
          password: data.password, // Set password or use PrivateKey
          // privateKey: require("fs").readFileSync("PATH OF KEY ") // <---- Uncomment this if you want to use privateKey ( Example : AWS )
        });
    }
  } catch (e) {
    logger.info(e);
  }
});
