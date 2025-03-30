export const handleError = (res, error) => {
  if (error.code) {
    switch (error.code) {
      case "23502":
        return {
          code: 400,
          message: "Faltan campos obligatorios",
        };
      case "23503":
        return {
          code: 400,
          message: "El registro no existe",
        };
      default:
        return {
          code: 500,
          message: "Error interno de postgres",
        };
    }
  }
  return {
    code: 500,
    message: "Error interno del servidor",
  };
};
