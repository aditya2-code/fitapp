const { upload } = require('../config/cloudinary');
const uploadProfilePicture = upload.single('profilePicture');
module.exports = {uploadProfilePicture};