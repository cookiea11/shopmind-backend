// This script defines the error handling middleware for the application. 
// It captures any errors that occur during request processing 
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;