const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 400 ? '\x1b[31m' : statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${statusColor}${statusCode}\x1b[0m - ${duration}ms`);
  });
  
  next();
};

module.exports = logger;