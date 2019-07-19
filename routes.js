const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')

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
                const data = {
                    'departamento': '0047',
                    'valida': 'OK',
                    'datos_periodo': '201930',
                    'nom_periodo': 'Segundo Semestre 2019',
                    'datos_nivel': 'PR',
                    'nom_nivel': 'Pregrado',
                    'BtnNRC': 'Buscar NRC',
                }
                const query = querystring.stringify(data)

                const options = {
                    hostname: 'guayacan.uninorte.edu.co',
                    port: 443,
                    path: '/registro/resultado_departamento1.php?' + query,
                    method: 'GET'
                }

                const extReq = https.request(options, extRes => {
                    var chunks = []
                    extRes.on('data', data =>
                        chunks.push(data)
                    )

                    extRes.on('end', () => {
                        res.statusCode = 200
                        res.setHeader('Content-type', 'text/html')
                        res.end(Buffer.concat(chunks).toString())
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
    }
}