const https = require('https')
const http = require('http')
const cheerio = require('cheerio')
const querystring = require('querystring')
const url = require('url')

const byDepSearch = require('../utils/urls').urls.byDepSearch
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong
const compensadorÑ = require('../utils/corrector').corrector.compensadorÑ

exports.grupos_dep = {
    methods: {
        /**
         * Retorna los grupos que pertenecen a un departamento dado el código del departamento, el nivel académico 
         * de la asignatura y el periodo, ejemplo: /grupos/dep?dep_code=0047&period=201930&level=PR
         * dep_code: es el código del departamento del que se requieren el grupo,
         * period: es el periodo para el cuál se necesitan el grupo,
         * level: es el grado educativo que cursan quienes se inscribirán el curso, de la siguiente manera:
         * PR: 'Pregrado'
         * PG: 'Postgrado'
         * EC: 'Educación Continua'
         * EX: 'Extracurricular'
         */
        GET: (req, res) => {
            const reqQuery = url.parse(req.url).query
            const reqData = querystring.parse(reqQuery)

            const data = {
                departamento: reqData.dep_code,
                datos_periodo: reqData.period,
                datos_nivel: reqData.level
            }
            const query = querystring.stringify(data)

            const options = {
                hostname: byDepSearch.hostname,
                port: 443,
                path: byDepSearch.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(query)
                }
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data =>
                    chunks.push(data)
                )

                extRes.on('end', () => {
                    const html = Buffer.concat(chunks)

                    const $ = cheerio.load(html)
                    const grp = {}
                    const nrcsHtml = $('#programa > option')
                    var nrcsKeys = Object.keys(nrcsHtml)
                    nrcsKeys.splice(nrcsHtml.length)

                    Promise.all(
                        nrcsKeys.map(async (i) => {
                            if (i > 0) {
                                let details =$(nrcsHtml[i]).text().split('-')
                                grp[i - 1] = {
                                    name: compensadorÑ(details.slice(1, details.length - 1).join('-').trim()),
                                    nrc: details[0].trim()
                                }

                                await getGroupDet(grp[i - 1].nrc, reqData.period, reqData.level)
                                    .then(grpDet => {
                                        grp[i - 1].subj_code = grpDet.subject.slice(0, 3)
                                        grp[i - 1].course = grpDet.subject.slice(3)
                                    })
                                    .catch(error => {
                                        return error
                                    })
                            }
                        })
                    ).then(() => {
                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.end(JSON.stringify(grp))
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

            extReq.write(query)
            extReq.end()
        }
    }
}

/**
 * Obtiene información detallada del grupo dado.
 * @param {string} nrc NRC de la asignatura a consultar.
 * @param {string} period Periodo para el cuál se desea consultar la informació de la asignatura.
 * @param {string} level Nivel al que pertenece la asignatura a consultar.
 */
function getGroupDet(nrc, period, level) {
    let data = {
        nrc: nrc,
        period: period,
        level: level
    }
    let query = querystring.stringify(data)

    let options = {
        hostname: 'localhost',
        port: process.env.PORT || 8080,
        path: '/grupo/det?' + query,
        method: 'GET'
    }

    return new Promise((resolve, reject) => {
        let req = http.request(options, res => {
            let chunks = []
            res.on('data', data => {
                chunks.push(data)
            })

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