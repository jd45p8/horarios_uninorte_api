const https = require('https')
const cheerio = require('cheerio')
const querystring = require('querystring')
const url = require('url')

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
                hostname: 'guayacan.uninorte.edu.co',
                port: 443,
                path: '/registro/resultado_departamento1.php',
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
                    let grp = {}
                    $('#programa option').each((i, elem) => {
                        if (i != 0) {
                            const details = $(elem).text().split('-')
                            grp[i - 1] = {
                                subj_code: details[details.length - 1].trim().slice(0, 3),
                                course: details[details.length - 1].trim().slice(3),
                                name: compensadorÑ(details.slice(1, details.length - 1).join('-').trim()),
                                nrc: details[0].trim()
                            }
                        }
                    })

                    res.statusCode = 200
                    res.setHeader('Content-type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify(grp))
                    return
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