const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

exports.routes = {
    '/departamentos': {
        methods: {
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
                        res.write(JSON.stringify(dep))
                        res.end()
                        return
                    })
                })


                extReq.on('error', error => {
                    res.statusCode = 500
                    res.setHeader('Content-type', 'text/html')
                    res.end('<h1>500, something went wrong!</h1>')
                    return
                })

                extReq.end()
            }
        }
    },
    '/asignaturas': {
        methods: {
            GET: (req, res) => {
                const reqQuery = url.parse(req.url).query
                const reqData = querystring.parse(reqQuery)

                const data = {
                    departamento: reqData.dep_code,
                    valida: 'OK',
                    datos_periodo: reqData.periodo,
                    nom_periodo: 'Segundo Semestre 2019',
                    datos_nivel: reqData.nivel,
                    nom_nivel: 'Pregrado',
                    BtnNRC: 'Buscar NRC',
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
                        $('#programa option').each((i,elem) => {
                            if (i != 0) {
                                const details = $(elem).text().split('-')
                                asig[i-1] = {
                                    code: details[details.length-1].trim().slice(0,3),
                                    course: details[details.length-1].trim().slice(3),
                                    name: details.slice(1,details.length-1).join('-').trim(),
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
                    res.statusCode = 500
                    res.setHeader('Content-type', 'text/html')
                    res.end('<h1>500, something went wrong!</h1>')
                    return
                })

                extReq.write(query)
                extReq.end()
            }
        }
    }
}