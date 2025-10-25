// Server configuration for handling large requests
export default {
  // Increase body size limit to 10MB
  bodyParser: {
    json: {
      limit: '10mb'
    },
    urlencoded: {
      limit: '10mb',
      extended: true
    }
  },
  // Increase header size
  maxHeaderSize: 16384 // 16KB
};

