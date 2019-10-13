const https = require('https')
const http = require('http')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const mainFormConsulta = require('../utils/urls').urls.mainFormConsulta
const byDepSearch = require('../utils/urls').urls.byDepSearch
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong
const compensadorÑ = require('../utils/corrector').corrector.compensadorÑ

module.exports = {
    grupos_all: {
        methods: {
            /**
             * Retorna todos los grupos dados y el periodo y el nivel educativo, 
             * ejemplo: /grupos/all?period=201930&level=PR
             * period: es el periodo para el cuál se necesitan las grupos,
             * level: es el grado educativo que cursan quienes se inscribirán en los grupos, de la siguiente manera:
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

                        let grp = {}
                        let index = 0;

                        await Promise.all(dep.map(async (dep_code) => {
                            await module.exports.getGruposDep(dep_code, reqData.period, reqData.level)
                                .then(new_courses => {
                                    Object.keys(new_courses).map(i => {
                                        grp[index] = cur_new[i]
                                        index++
                                    })
                                }).catch(error => {
                                    return error
                                })

                        })).then(() => {
                            res.statusCode = 200
                            res.setHeader('Content-type', 'application/json; charset=utf-8')
                            res.write(JSON.stringify(grp))
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
    },

    /**
     * Retorna los grupos que pertenecen al departamento dado.
     * @param {String} dep_code Código del departamento a consultar.
     * @param {String} period Período para el cuál se desean consultar los grupos.
     * @param {String} level Nivel al que pertenecen los grupos a consultar.
     */
    getGruposDep: function (dep_code, period, level) {
        const data = {
            dep_code: dep_code,
            period: period,
            level: level
        }
        const query = querystring.stringify(data)

        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 8080,
            path: '/grupos/dep?' + query,
            method: 'GET'
        }

        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                let chunks = []
                res.on('data', data =>
                    chunks.push(data)
                )

                res.on('end', () => {
                    let response = Buffer.concat(chunks)
                    if (res.statusCode == 200) {
                        resolve(JSON.parse(response))
                    } else {
                        reject(response.toString())
                    }
                })
            })

            req.on('error', error => {
                reject(error)
            })

            req.end()
        })
    }
}