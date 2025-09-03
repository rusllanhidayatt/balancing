const { v2: cloudinary3 } = require("cloudinary");


// Configure once on import; fails fast if missing when used
cloudinary3.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
});


module.exports = { cloudinary: cloudinary3 };