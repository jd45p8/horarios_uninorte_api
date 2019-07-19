const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const somethingWentWrong = res => {
    res.statusCode = 500
    res.setHeader('Content-type', 'text/html')
    res.end('<h1>500, something went wrong!</h1>')
}

exports.routes = {
    '/periodos': {
        methods: {
            /**
             * Retorna el número y nombre de cada uno periodos disponibles para consultar
             */
            GET: (req, res) => {
                const options = {
                    hostname: 'guayacan.uninorte.edu.co',
                    port: 443,
                    path: '/registro/consulta_horarios.asp',
                    method: 'GET'
                }

                const extReq = https.request(options, extRes => {
                    var chunks = []
                    extRes.on('data', data =>
                        chunks.push(data)
                    )

                    extRes.on('end', () => {
                        const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                        const html = iconv.convert(Buffer.concat(chunks))

                        const $ = cheerio.load(html)
                        let per = {}
                        $('#periodo option').each((i, elem) => {
                            if (i != 0) {
                                per[i - 1] = {
                                    period: $(elem).attr('value'),
                                    name: $(elem).text()
                                }
                            }
                        })

                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.write(JSON.stringify(per))
                        res.end()
                    })
                })

                extReq.on('error', error => {
                    somethingWentWrong(res)
                })

                extReq.end()
            }
        }
    },
    '/niveles': {
        methods: {
            /**
             * Retorna el número y nombre de cada uno periodos disponibles para consultar
             */
            GET: (req, res) => {
                const options = {
                    hostname: 'guayacan.uninorte.edu.co',
                    port: 443,
                    path: '/registro/consulta_horarios.asp',
                    method: 'GET'
                }

                const extReq = https.request(options, extRes => {
                    var chunks = []
                    extRes.on('data', data =>
                        chunks.push(data)
                    )

                    extRes.on('end', () => {
                        const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                        const html = iconv.convert(Buffer.concat(chunks))

                        const $ = cheerio.load(html)
                        let lev = {}
                        $('#nivel option').each((i, elem) => {
                            if (i != 0) {
                                lev[i - 1] = {
                                    level: $(elem).attr('value'),
                                    name: $(elem).text()
                                }
                            }
                        })

                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.write(JSON.stringify(lev))
                        res.end()
                    })
                })

                extReq.on('error', error => {
                    somethingWentWrong(res)
                })

                extReq.end()
            }
        }
    },
    '/departamentos': {
        methods: {
            /**
             * Retorna los nombres y códigos de los departamentos
             */
            GET: (req, res) => {
                const options = {
                    hostname: 'guayacan.uninorte.edu.co',
                    port: 443,
                    path: '/registro/consulta_horarios.asp',
                    method: 'GET'
                }

                const extReq = https.request(options, extRes => {
                    var chunks = []
                    extRes.on('data', data =>
                        chunks.push(data)
                    )

                    extRes.on('end', () => {
                        const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                        const html = iconv.convert(Buffer.concat(chunks))

                        const $ = cheerio.load(html)
                        let dep = {}
                        $('#departamento option').each((i, elem) => {
                            if (i != 0) {
                                dep[i - 1] = {
                                    name: $(elem).text(),
                                    code: $(elem).attr('value')
                                }
                            }
                        })

                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.end(JSON.stringify(dep))
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
    },
    '/asignaturas': {
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
                    var chunks = []
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
}