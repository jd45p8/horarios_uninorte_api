const https = require('https')
const cheerio = require('cheerio')
const querystring = require('querystring')
const url = require('url')
const Iconv = require('iconv').Iconv
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.grupo_det = {
    methods: {
        /**
         * Retorna los detalles de un grupo dados el periodo, nivel académico de la asignatura Y nrc, 
         * ejemplo: /grupo/det?nrc=3284&period=201930&level=PR
         * nrc: es el número de referencia del curso, que identifica un grupo,
         * period: es el periodo para el cuál se necesita el grupo,
         * level: es el grado educativo que cursan quienes se inscribirán el curso, de la siguiente manera:
         * PR: 'Pregrado'
         * PG: 'Postgrado'
         * EC: 'Educación Continua'
         * EX: 'Extracurricular'
         */
        GET: (req, res) => {
            const reqQuery = url.parse(req.url).query
            const reqData = querystring.parse(reqQuery)

            const data = {
                valida: 'OK',
                nrc: reqData.nrc,
                datos_periodo: reqData.period,
                datos_nivel: reqData.level
            }
            const query = querystring.stringify(data)

            const options = {
                hostname: 'guayacan.uninorte.edu.co',
                port: 443,
                path: '/registro/resultado_nrc1.asp',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(query)
                }
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data => {
                    chunks.push(data)
                })

                extRes.on('end', () => {
                    try {
                        const iconv = new Iconv('ISO-8859-1', 'UTF-8')
                        const html = iconv.convert(Buffer.concat(chunks))

                        const $ = cheerio.load(html)
                        const det = {
                            subject_name: $('body > div > p.msg1').text(),
                            dep_name: $('body > div > p:nth-child(2)').text(),
                            det_asign: $('body > div > p:nth-child(3)').text().split('\n\t\t\t'),
                            cupos: $('body > div > p:nth-child(4)').text().split('\n\t\t\t'),
                            professors: $('body > div > p.msg5').text().trim().split(':')[1].split('\n\t'),
                            dates: $('body > div > p.msg3').text().split('\n')
                        }

                        let grp_det = {
                            name: det.subject_name,
                            dep_name: det.dep_name.split(':').slice(1).join(' ').trim(),
                            subject: det.det_asign[0].split(':')[1].trim(),
                            level: det.det_asign[3].split(':')[1].trim(),
                            group_number: det.det_asign[1].split(':')[1].trim(),
                            cupos: {
                                registered: det.cupos[0].split(':')[1].trim(),
                                available: det.cupos[1].split(':')[1].trim()
                            },
                            professors: [],
                            dates: {
                                start: det.dates[1].split(':')[1],
                                end: det.dates[2].split(':')[1]
                            },
                            schedule: []
                        }

                        det.professors.map(professor => {
                            grp_det.professors.push({
                                first_name: professor.trim().split(',')[1].trim(),
                                last_name: professor.trim().split(',')[0].trim()
                            })
                        })

                        $('#acreditaciones_resultado > div > div > table > tbody tr').each((i, elem) => {
                            if (i != 0) {
                                const row = $(elem).text().trim().split('\n')
                                let new_item = {
                                    day: row[2].trim(),
                                    interval: {
                                        start: row[3].split('-')[0].trim(),
                                        end: row[3].split('-')[1].trim()
                                    },
                                    location: row[4].trim()
                                }

                                /**
                                 * Evita añadir al horario más de una entrada con lso mismos datos
                                 */
                                if (!grp_det.schedule.some(item => {
                                    return (item.day == new_item.day &&
                                        item.interval.end == new_item.interval.end &&
                                        item.location == new_item.location)
                                })) {
                                    grp_det.schedule.push(new_item)
                                }
                            }
                        })

                        res.statusCode = 200,
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.end(JSON.stringify(grp_det))
                        return
                    } catch (error) {
                        console.error(error)
                        somethingWentWrong(res)
                        return
                    }
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