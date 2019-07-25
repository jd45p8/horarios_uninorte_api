const https = require('https')
const cheerio = require('cheerio')
const Iconv = require('iconv').Iconv
const querystring = require('querystring')
const url = require('url')

const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong
const compensadorÑ = require('../utils/corrector').corrector.compensadorÑ

exports.asignaturas_all = {
    methods: {
        /**
         * Retorna todos los asignaturas dados y el periodo y el nivel educativo, 
         * ejemplo: /asignaturas/all?period=201930&level=PR
         * period: es el periodo para el cuál se necesitan las asignaturas,
         * level: es el grado educativo que cursan quienes se inscribirán en los asignaturas, de la siguiente manera:
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

                    let asig = {}
                    let index = 0;
                    try {
                        await Promise.all(dep.map(async (elem) => {
                            data['departamento'] = elem
                            const query = querystring.stringify(data)

                            let cur_new = await getAsignaturas(query)
                            cur_new.map(elem => {
                                /**
                                 * Valida si hay departamentos con asignaturas iguales a las de otros de partamentos
                                 */
                                let found = false;
                                for (let key in asig) {
                                    if (asig[key].subj_code == elem.subj_code &&
                                        asig[key].course == elem.course) {
                                        found = true;
                                        break;
                                    }
                                }

                                if (!found) {
                                    asig[index] = elem
                                    index++
                                }
                            })

                        }))
                    } catch (error) {
                        console.error(error)
                        somethingWentWrong(res)
                        return
                    }

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

    return new Promise((resolve, reject) => {
        const extReq = https.request(options, extRes => {
            let chunks = []
            extRes.on('data', data =>
                chunks.push(data)
            )

            extRes.on('end', () => {
                const html = Buffer.concat(chunks)

                const $ = cheerio.load(html)
                let asig = []
                $('#programa option').each((i, elem) => {
                    if (i != 0) {
                        const details = $(elem).text().split('-')
                        let new_asig = {
                            subj_code: details[details.length - 1].trim().slice(0, 3).trim(),
                            course: details[details.length - 1].trim().slice(3).trim(),
                            name: compensadorÑ(details.slice(1, details.length - 1).join('-').trim()),
                        }

                        if (!asig.some(asg => {
                            return (asg.subj_code == new_asig.subj_code &&
                                asg.course == new_asig.course)
                        })) {
                            asig.push(new_asig)
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