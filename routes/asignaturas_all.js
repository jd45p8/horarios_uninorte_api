const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const somethingWentWrong = require('../utils/errors').somethingWentWrong

exports.asignaturas_all = {
    methods: {
        /**
         * Retorna todas las asignaturas dados y el periodo y el nivel educativo, 
         * ejemplo: /asignaturas?period=201930&level=PR
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

            let data = {
                datos_periodo: reqData.period,
                datos_nivel: reqData.level
            }

            const options = {
                hostname: 'guayacan.uninorte.edu.co',
                port: 443,
                path: '/registro/consulta_horarios.asp',
                method: 'GET'
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data =>
                    chunks.push(data)
                )

                extRes.on('end', () => {
                    const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                    const html = iconv.convert(Buffer.concat(chunks))

                    const $ = cheerio.load(html)
                    let asig = {}
                    let index = 0;
                    $('#departamento option').each(async (i, elem) => {
                        if (i != 0) {
                            data['departamento'] = $(elem).attr('value')
                            const query = querystring.stringify(data)
                            try {
                                let asig_new = await getAsignaturas(query)
                                Object.keys(asig_new).map(elem => {
                                    asig[index] = asig_new[elem]
                                    index++
                                })
                            } catch (error) {
                                somethingWentWrong(res)
                                return
                            }                            
                        }
                    })

                    res.statusCode = 200
                    res.setHeader('Content-type', 'application/json; charset=utf-8')
                    res.write(JSON.stringify(asig))
                    res.end()
                    return
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

function getAsignaturas(query) {
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

    return new Promise(resolve => {
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
                resolve(asig)
            })
        })

        extReq.on('error', error => {
            reject(error)
        })

        extReq.write(query)
        extReq.end()
    })
}