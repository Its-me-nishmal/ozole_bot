// const cluster = require('cluster');
// const os = require('os');

// const numCPUs = os.cpus().length;

// if (cluster.isMaster) {
//   console.log(`Master process ${process.pid} is running`);

//   // Fork workers.
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
//   require('./app');
//   console.log(`Worker process ${process.pid} started`);
// }

require('./app.js')