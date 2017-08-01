const { Swarm, Logger } = require('12imam-swarm');
const assert = require('assert');
const Utp = require('../');
const logger = new Logger('test/connect-each-other');

describe('Case: connect each other', () => {
  beforeEach(() => {
    process.on('unhandledRejection', r => console.error('unhandledRejection', r));
  });

  afterEach(async () => {
    process.removeAllListeners('unhandledRejection');
    await reset();
  });

  it('connected to each other', async () => {
    let swarm1 = createSwarm(12001);
    let swarm2 = createSwarm(12002, 'utp://localhost:12001');

    await swarm1.start();
    await swarm2.start();

    logger.log('Swarms started');

    assert.equal(swarm2.peers.length, 1);

    await new Promise(async (resolve, reject) => {
      let app = 'foo';
      let command = 'bar';
      let payload = 'baz';

      swarm1.on('message', data => {
        logger.log('Received message');

        assert.equal(app, data.app);
        assert.equal(command, data.command);
        assert.equal(payload, data.payload);
        resolve();
      });

      await swarm2.send({ address: swarm1.address, app, command, payload });
      logger.log('Sent message');
    });
  });

  let swarms = [];
  function createSwarm (port, peer) {
    let channel = new Utp({ port });
    let swarm = new Swarm();
    swarm.addChannel(channel);

    if (peer) {
      swarm.bootPeers.push(peer);
    }

    swarms.push(swarm);
    return swarm;
  }

  async function reset () {
    await Promise.all(swarms.map(swarm => swarm.stop()));
  }
});
