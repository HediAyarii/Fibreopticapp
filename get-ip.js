const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Ignorer les interfaces internes et IPv6
      if (interface.family === 'IPv4' && !interface.internal) {
        // Chercher les adresses IP privées typiques
        if (interface.address.startsWith('192.168.') || 
            interface.address.startsWith('10.') || 
            interface.address.startsWith('172.')) {
          return interface.address;
        }
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`Adresse IP locale: ${localIP}`);
console.log(`URL d'accès: http://${localIP}:3000`);
console.log(`URL technicien: http://${localIP}:3000/logintech`);
console.log(`URL dashboard: http://${localIP}:3000/technicien/dashboard`);
