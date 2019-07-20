const https = require('https')
const cheerio = require('cheerio')
const querystring = require('querystring')
const url = require('url')
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.asignaturas = {
    methods: {
        /**
         * Retorna las asignaturas dados los datos de un departamento y el periodo, 
         * ejemplo: /asignaturas?dep_code=0047&period=201930&level=PR
         * dep_code: es el código del departamento del que se requieren las asignaturas,
         * period: es el periodo para el cuál se necesitan las asignaturas,
         * level: es el grado educativo que cursan quienes se inscribirán en la asignatura, de la siguiente manera:
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
                    let asig = {}
                    $('#programa option').each((i, elem) => {
                        if (i != 0) {
                            const details = $(elem).text().split('-')
                            asig[i - 1] = {
                                code: details[details.length - 1].trim().slice(0, 3),
                                course: details[details.length - 1].trim().slice(3),
                                name: details.slice(1, details.length - 1).join('-').trim(),
                                nrc: details[0].trim()
                            }
                        }
                    })

                    res.statusCode = 200
                    res.setHeader('Content-type', 'application/json; charset=utf-8')
                    res.end(JSON.stringify(asig))
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