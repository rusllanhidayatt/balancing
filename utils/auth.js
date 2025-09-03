const { USERS } = require("./users");


function getUser(req) {
const username = req.header("x-username");
return USERS.find((u) => u.username === username);
}


module.exports = { getUser };