const { Channel } = require('twlv-swarm');
const utp = require('utp-native');
const { URL } = require('url');

const LISTEN_TIMEOUT = 10000;

class Utp extends Channel {
  constructor ({ port = 12221 }) {
    super('utp');

    this.port = port;
  }

  async up () {
    this.logger.log(`Getting up at port ${this.port} ...`);
    this.server = utp.createServer(this._onListening.bind(this));

    await new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        clearTimeout(timeout);
        resolve();
      });
      let timeout = setTimeout(reject, LISTEN_TIMEOUT);
    });
  }

  _onListening (socket) {
    let { address, port } = socket.address();
    let url = `${this.proto}://${address}:${port}`;

    this.incoming({ url, socket });
  }

  connect (url) {
    this.logger.log(`Connecting to ${url} ...`);
    let u = new URL(url);
    let port = u.port;
    let host = u.hostname;
    let client = utp.connect(port, host);
    return client;
  }

  async down () {
    this.logger.log(`Getting down ...`);
    if (!this.server) {
      return;
    }

    await new Promise(resolve => {
      this.server.close(resolve);
      this.server = null;
    });
  }

  formatUrl (ip, port) {
    return `${this.proto}://${ip}:${this.port}`;
  }

  dump () {
    let { proto, port } = this;
    return { proto, port };
  }
}

module.exports = Utp;
