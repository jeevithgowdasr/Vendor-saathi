export const errorHandler = (err, req, res, next) => {
  console.error('❌ [Backend Error]:', err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
