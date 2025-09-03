const { USERS } = require("./users");

function getUser(req) {
  // Simple header-based auth for local app: 'x-username'
  const username = req.headers['x-username'] || (req.body && req.body.nama) || null;
  if (!username) return null;
  return USERS.find(u => u.username === username) || null;
}

module.exports = { getUser };
