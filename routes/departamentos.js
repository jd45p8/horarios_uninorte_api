const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv

const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.departamentos = {
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
                let chunks = []
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
}