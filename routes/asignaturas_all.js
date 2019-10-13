const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const getGruposDep = require('../routes/grupos_all').getGruposDep
const mainFormConsulta = require('../utils/urls').urls.mainFormConsulta
const byDepSearch = require('../utils/urls').urls.byDepSearch
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong
const compensadorÑ = require('../utils/corrector').corrector.compensadorÑ

exports.asignaturas_all = {
    methods: {
        /**
         * Retorna todos los asignaturas dados y el periodo y el nivel educativo, 
         * ejemplo: /asignaturas/all?period=201930&level=PR
         * period: es el periodo para el cuál se necesitan las asignaturas,
         * level: es el grado educativo que cursan quienes se inscribirán en los asignaturas, de la siguiente manera:
         * PR: 'Pregrado'
         * PG: 'Postgrado'
         * EC: 'Educación Continua'
         * EX: 'Extracurricular'
         */
        GET: (req, res) => {
            const reqQuery = url.parse(req.url).query
            const reqData = querystring.parse(reqQuery)

            let data = {
                datos_periodo: reqData.period,
                datos_nivel: reqData.level
            }

            const options = {
                hostname: mainFormConsulta.hostname,
                port: 443,
                path: mainFormConsulta.path,
                method: 'GET'
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data =>
                    chunks.push(data)
                )

                extRes.on('end', async () => {
                    const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                    const html = iconv.convert(Buffer.concat(chunks))

                    const $ = cheerio.load(html)
                    let dep = []
                    $('#departamento option').each((i, elem) => {
                        if (i != 0) {
                            dep[i - 1] = $(elem).attr('value')
                        }
                    })

                    let asig = {}
                    let index = 0;

                    await Promise.all(dep.map(async (dep_code) => {
                        let cur_new = await getAsignaturas(dep_code, reqData.period, reqData.level)
                        cur_new.map(elem => {
                            /**
                             * Valida si hay departamentos con asignaturas iguales a las de otros de partamentos
                             */
                            let found = false;
                            for (let key in asig) {
                                if (asig[key].subj_code == elem.subj_code &&
                                    asig[key].course == elem.course) {
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                asig[index] = elem
                                index++
                            }
                        })

                    })).then(() => {
                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.write(JSON.stringify(asig))
                        res.end()
                        return
                    }).catch(error => {
                        console.error(error)
                        somethingWentWrong(res)
                        return
                    })
                })
            })

            extReq.on('error', error => {
                somethingWentWrong(res)
                return
            })

            extReq.end()
        }
    }
}

/**
 * Retorna las asignaturas que pertenecen al departamento dado.
 * @param {String} dep_code Código del departamento a consultar.
 * @param {String} period Período para el cuál se desean consultar los grupos.
 * @param {String} level Nivel al que pertenecen los grupos a consultar.
 */
function getAsignaturas(dep_code, period, level) {
    return getGruposDep(dep_code, period, level)
        .catch(error => {
            return error
        }).then(gruposDep => {
            let asig = []
            Object.keys(gruposDep).map(i => {
                if (!asig.some(asg => {
                    return (asg.subj_code == gruposDep[i].subj_code &&
                        asg.course == gruposDep[i].course)
                })) {
                    asig.push(gruposDep[i])
                }
            })
            return asig
        })
}