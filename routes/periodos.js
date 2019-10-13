const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv

const mainFormaConsulta = require('../utils/urls').urls.mainFormConsulta
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.periodos = {
    methods: {
        /**
         * Retorna el número y nombre de cada uno periodos disponibles para consultar
         */
        GET: (req, res) => {
            const options = {
                hostname: mainFormaConsulta.hostname,
                port: 443,
                path: mainFormaConsulta.path,
                method: 'GET'
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data =>
                    chunks.push(data)
                )

                extRes.on('end', () => {
                    const html = Buffer.concat(chunks).toString()

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