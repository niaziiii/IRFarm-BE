const successResponse = (
  res,
  data = [],
  count = undefined,
  message = "success",
  statusCode = 200
) => {
  res.status(statusCode).json({ message: message, count: count, data: data });
};

export { successResponse };
