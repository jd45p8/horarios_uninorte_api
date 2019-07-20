const periodos = require('./routes/periodos').periodos
const niveles = require('./routes/niveles').niveles
const departamentos = require('./routes/departamentos').departamentos
const grupos_subj_det = require('./routes/grupos_subj_det').grupos_subj_det
const grupos_dep = require('./routes/grupos_dep').grupos_dep
const grupos_all = require('./routes/grupos_all').grupos_all
const grupo_det = require('./routes/grupo_det').grupo_det


exports.routes = {
    '/periodos': periodos,
    '/niveles': niveles,
    '/departamentos': departamentos,
    '/grupo/det': grupo_det,
    '/grupos/subj/det': grupos_subj_det,
    '/grupos/dep': grupos_dep,
    '/grupos/all': grupos_all    
}