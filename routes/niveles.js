const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv

const mainFormConsulta = require('../utils/urls').urls.mainFormConsulta
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.niveles = {
    methods: {
        /**
         * Retorna el número y nombre de cada uno periodos disponibles para consultar
         */
        GET: (req, res) => {
            const options = {
                hostname: mainFormConsulta.hostname,
                port: 443,
                path: mainFormConsulta.path,
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
                    let lev = {}
                    $('#nivel option').each((i, elem) => {                        
                        lev[i] = {
                            level: $(elem).attr('value'),
                            name: $(elem).text()
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