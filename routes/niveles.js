const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv

const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.niveles = {
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
                let chunks = []
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