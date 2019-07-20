const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.grupos_all = {
    methods: {
        /**
         * Retorna todos los grupos dados y el periodo y el nivel educativo, 
         * ejemplo: /grupos/all?period=201930&level=PR
         * period: es el periodo para el cuál se necesitan las grupos,
         * level: es el grado educativo que cursan quienes se inscribirán en los grupos, de la siguiente manera:
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

                extRes.on('end', async () => {
                    const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                    const html = iconv.convert(Buffer.concat(chunks))

                    const $ = cheerio.load(html)
                    let dep = []
                    $('#departamento option').each((i, elem) => {
                        if (i != 0) {
                            dep[i - 1] = $(elem).attr('value')
                        }
                    })

                    let grp = {}
                    let index = 0;
                    try {
                        await Promise.all(dep.map(async (elem) => {
                            data['departamento'] = elem
                            const query = querystring.stringify(data)
                                   
                            let cur_new = await getGrupos(query)
                            Object.keys(cur_new).map(elem => {
                                grp[index] = cur_new[elem]
                                index++
                            })

                        }))
                    } catch (error) {
                        console.error(error)
                        somethingWentWrong(res)
                        return
                    }

                    res.statusCode = 200
                    res.setHeader('Content-type', 'application/json; charset=utf-8')
                    res.write(JSON.stringify(grp))
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

function getGrupos(query) {
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

    return new Promise((resolve,reject) => {
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
                            name: details.slice(1, details.length - 1).join('-').trim(),
                            nrc: details[0].trim()
                        }
                    }
                })
                resolve(grp)
            })
        })

        extReq.on('error', error => {
            reject(error)
        })

        extReq.write(query)
        extReq.end()
    })
}