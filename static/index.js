window.addEventListener("load", function() {
  var form = document.getElementById("ssh-data");
  form.reset();
  form.addEventListener("submit", (e) => {
    const data = Object.fromEntries(new FormData(e.target).entries());
    console.log(data);
    if (
      data.hostname == "" ||
      data.username == "" ||
      data.port == "" ||
      data.password == ""
    ) {
      if (data.hostname == "")
        document.getElementById("hostname").classList.add("is-invalid");
      if (data.username == "")
        document.getElementById("username").classList.add("is-invalid");
      if (data.port == "")
        document.getElementById("port").classList.add("is-invalid");
      if (data.password == "")
        document.getElementById("password").classList.add("is-invalid");
      document.getElementById("alert").classList.remove("hide");
    } else {
      document.getElementById("alert").classList.add("hide");
      console.log(
        "GOT Data from UI; Going to create a websocket for this connection."
      );
      var terminalContainer = document.getElementById("terminal-container");
      var fit = new FitAddon.FitAddon();
      var term = new Terminal({
        cursorBlink: true,
        theme: { background: "#090c0f" },
      });
      term.loadAddon(fit);
      term.open(terminalContainer);
      fit.fit();
      this.term = term;
      // term.fit();
      var tmpData = Object.copy(data);
      tmpData.type = "webshell";
      socket = io.connect({ query: tmpData });
      this.socket = socket;
      socket.on("connect", function() {
        console.log("Connected to backend");
        document.getElementById("xterm").classList.remove("hide");
        document.getElementById("sshalert").classList.add("alert-success");
        document.getElementById("sshalert").innerHTML =
          "Connected to: " +
          data.hostname +
          "<div class='float-right'><button class='btn btn-danger btn-sm' onclick='disconnect()'>Disconnect</button></div>";
        document.getElementById("formsection").classList.add("hide");
        term.write("\r\n*** Connected to backend***\r\n");

        // Browser -> Backend
        term.onData(function(data) {
          //                        alert("Not allowd to write. Please don't remove this alert without permission of Ankit or Samir sir. It will be a problem for server'");
          socket.emit("data", data);
        });

        // Backend -> Browser
        socket.on("data", function(data) {
          console.log("socket.on data:", data);
          term.write(data);
          if (data.includes("SSH CONNECTION CLOSED")) {
            document
              .getElementById("sshalert")
              .classList.remove("alert-success");
            document.getElementById("sshalert").classList.add("alert-danger");
            document.getElementById("sshalert").innerHTML =
              "Disconnected from server";
            socket.disconnect();
            //console.log(term);
            term.dispose();
          }
          if (data.includes("SSH CONNECTION ERROR:")) {
            alert(data);
            if (
              data.includes("Command not found for connection type execute")
            ) {
              document
                .getElementById("sshalert")
                .classList.remove("alert-success");
              document.getElementById("sshalert").classList.add("alert-danger");
              document.getElementById("sshalert").innerHTML =
                "Disconnected from server";
              socket.disconnect();
              term.dispose();
            }
          }
        });

        socket.on("disconnect", function() {
          term.write("\r\n*** Disconnected from backend***\r\n");
          document.getElementById("sshalert").classList.remove("alert-success");
          document.getElementById("sshalert").classList.add("alert-danger");
          document.getElementById("sshalert").innerHTML =
            "<button class='btn btn-primary btn-sm' id='toggle' onclick='toggleView()'>Go Back</button>" +
            " Socket closed: disconnected from server ";
        });
      });
    }
    e.preventDefault();
  });
  form.addEventListener("input", (e) => {
    console.log(e.target.value);
    if (e.target.value != null || e.target.value != "") {
      document.getElementById(e.target.id).classList.remove("is-invalid");
    }
  });
  var username_qs = getParameterByName("username");
  var port_qs = getParameterByName("port");
  var hostname_qs = getParameterByName("hostname");
  var password_qs = getParameterByName("password");
  var type_qs = getParameterByName("type");
  var command_qs = getParameterByName("command");
  if (username_qs != null && typeof username_qs != "undefined") {
    console.log("username_qs=", username_qs);
    document.getElementById("username").setAttribute("value", username_qs);
  }
  if (hostname_qs != null && typeof hostname_qs != "undefined") {
    console.log("hostname_qs=", hostname_qs);
    document.getElementById("hostname").setAttribute("value", hostname_qs);
  }
  if (port_qs != null && typeof port_qs != "undefined") {
    console.log("port_qs=", port_qs);
    document.getElementById("port").setAttribute("value", port_qs);
  }
  if (password_qs != null && typeof password_qs != "undefined") {
    console.log("password_qs=", username_qs);
    document.getElementById("password").setAttribute("value", password_qs);
  }
  if (type_qs != null && typeof type_qs != "undefined") {
    console.log("type_qs=", type_qs);
  } else {
    type_qs = "webshell";
  }
  if (command_qs != null && typeof command_qs != "undefined") {
    console.log("command_qs=", command_qs);
  } else {
    command_qs = null;
  }
  if (
    hostname_qs != null &&
    username_qs != null &&
    password_qs != null &&
    port_qs != null
  ) {
    const data = {
      username: username_qs,
      password: password_qs,
      port: port_qs,
      hostname: hostname_qs,
      type: type_qs,
      command: command_qs,
    };
    document.getElementById("alert").classList.add("hide");
    console.log(
      "GOT Data from UI; Going to create a websocket for this connection."
    );
    var terminalContainer = document.getElementById("terminal-container");
    var fit = new FitAddon.FitAddon();
    var term = new Terminal({
      cursorBlink: true,
      theme: { background: "#090c0f" },
    });
    term.loadAddon(fit);
    term.open(terminalContainer);
    fit.fit();
    this.term = term;
    // term.fit();

    socket = io.connect({ query: data });
    this.socket = socket;
    socket.on("connect", function() {
      console.log("Connected to backend");
      document.getElementById("xterm").classList.remove("hide");
      document.getElementById("sshalert").classList.add("alert-success");
      document.getElementById("sshalert").innerHTML =
        "Connected to: " +
        data.hostname +
        "<div class='float-right'><button class='btn btn-danger btn-sm' onclick='disconnect()'>Disconnect</button></div>";
      document.getElementById("formsection").classList.add("hide");
      term.write("\r\n*** Connected to backend***\r\n");

      // Browser -> Backend
      term.onData(function(data) {
        //                        alert("Not allowd to write. Please don't remove this alert without permission of Ankit or Samir sir. It will be a problem for server'");
        socket.emit("data", data);
      });

      // Backend -> Browser
      socket.on("data", function(data) {
        console.log("socket.on data:", data);
        term.write(data);
        if (data.includes("SSH CONNECTION CLOSED")) {
          document.getElementById("sshalert").classList.remove("alert-success");
          document.getElementById("sshalert").classList.add("alert-danger");
          document.getElementById("sshalert").innerHTML =
            "Disconnected from server";
          socket.disconnect();
          console.log(term);
          term.dispose();
        }
        if (data.includes("SSH CONNECTION ERROR:")) {
          alert(data);
          if (data.includes("Command not found for connection type execute")) {
            document
              .getElementById("sshalert")
              .classList.remove("alert-success");
            document.getElementById("sshalert").classList.add("alert-danger");
            document.getElementById("sshalert").innerHTML =
              "Disconnected from server";
            socket.disconnect();
            term.dispose();
          }
        }
        if (data.includes("COMMAND EXECUTED CONNECTION CLOSED")) {
          document.getElementById("sshalert").classList.remove("alert-success");
          document.getElementById("sshalert").classList.add("alert-danger");
          document.getElementById("sshalert").innerHTML =
            "Disconnected from server";
          socket.disconnect();
        }
      });

      socket.on("disconnect", function() {
        term.write("\r\n*** Disconnected from backend***\r\n");
        document.getElementById("sshalert").classList.remove("alert-success");
        document.getElementById("sshalert").classList.add("alert-danger");
        document.getElementById("sshalert").innerHTML =
          "<button class='btn btn-primary btn-sm' id='toggle' onclick='toggleView()'>Go Back</button>" +
          " Socket closed: disconnected from server ";
      });
    });
  }
});
function toggleView() {
  document.getElementById("xterm").classList.add("hide");
  document.getElementById("sshalert").classList.remove("alert-danger");
  document.getElementById("sshalert").innerHTML = "";
  document.getElementById("formsection").classList.remove("hide");
}
function disconnect() {
  this.socket.emit("data", "exit");
  this.socket.disconnect();
  this.term.dispose();
}
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
