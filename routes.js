const periodos = require('./routes/periodos').periodos
const niveles = require('./routes/niveles').niveles
const departamentos = require('./routes/departamentos').departamentos
const asignaturas = require('./routes/asignaturas').asignaturas
const asignaturas_all = require('./routes/asignaturas_all').asignaturas_all


exports.routes = {
    '/periodos': periodos,
    '/niveles': niveles,
    '/departamentos': departamentos,
    '/asignaturas': asignaturas,
    '/asignaturas/all': asignaturas_all
}