// utils/utils.js - Versión como módulo ES

/**
 * Limpia el RUT eliminando caracteres no válidos
 */
export const limpiarRut = (rut) => {
  if (typeof rut !== "string") return "";
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
};

/**
 * Valida el formato de RUT chileno
 */
export const validarFormatoRUT = (rut) => {
  if (typeof rut !== "string") return false;
  const regex = /^(\d{1,2}(?:\.?\d{3}){2}-?[\dkK]$|^\d{7,8}[\dkK]$)/i;
  return regex.test(rut);
};

/**
 * Calcula el dígito verificador
 */
export const calcularDigitoVerificador = (cuerpo) => {
  if (typeof cuerpo !== "string" || !/^\d+$/.test(cuerpo)) return "";

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resultado = 11 - (suma % 11);
  return resultado === 11 ? "0" : resultado === 10 ? "K" : resultado.toString();
};

/**
 * Valida el dígito verificador
 */
export const validarDigitoVerificador = (rut) => {
  const rutLimpio = limpiarRut(rut);
  if (rutLimpio.length < 2) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();

  return dv === calcularDigitoVerificador(cuerpo);
};

/**
 * Formatea un RUT
 */
export const formatearRUT = (rut) => {
  const rutLimpio = limpiarRut(rut);
  if (rutLimpio.length < 2) return rutLimpio;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();

  let formato = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formato}-${dv}`;
};

/**
 * Valida completamente un RUT
 */
export const validarRUT = (rut) => {
  return validarFormatoRUT(rut) && validarDigitoVerificador(rut);
};

/**
 * Normaliza un RUT
 */
export const normalizarRUT = (rut) => {
  if (!validarRUT(rut)) return "";
  return formatearRUT(rut);
};
