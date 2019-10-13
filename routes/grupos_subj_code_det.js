const https = require('https')
const url = require('url')
const querystring = require('querystring')
const cheerio = require('cheerio')

const byCodeSearch = require('../utils/urls').urls.byCodeSearch
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.grupos_subj_code_det = {
    methods: {
        /**
         * Retorna la información detallada de los grupos que tienen el código de asignatura dado, 
         * usando además de este, el nivel académico de la asignatura y el periodo, 
         * ejemplo: /grupo/subj_code/det?period=201930&subj_code=DEP&level=EX
         * subj_code: es el código de asignatura para el que se requieren los grupos,
         * period: es el periodo para el cuál se necesitan los grupos,
         * level: es el grado educativo de los grupos ascociados con el código de asignatura dado:
         * PR: 'Pregrado'
         * PG: 'Postgrado'
         * EC: 'Educación Continua'
         * EX: 'Extracurricular'
         */
        GET: (req, res) => {
            const reqQuery = url.parse(req.url).query
            const queryData = querystring.parse(reqQuery)

            const data = {
                valida: 'OK',
                mat: queryData.subj_code,
                datos_periodo: queryData.period,
                datos_nivel: queryData.level
            }

            const query = querystring.stringify(data)

            const options = {
                hostname: byCodeSearch.hostname,
                port: 443,
                path: byCodeSearch.path,
                method: 'POST',
                headers: {
                    'Content-Length': Buffer.byteLength(query),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }

            const extReq = https.request(options, extRes => {
                let chunks = []
                extRes.on('data', data => {
                    chunks.push(data)
                })

                extRes.on('end', () => {
                    const html = Buffer.concat(chunks)
                    const $ = cheerio.load(html)
                    let grp = {}

                    try {
                        $('body > div').each((index, elem) => {
                            const det = {
                                subject_name: $('p.msg1', elem).text(),
                                dep_name: $('p:nth-child(2)', elem).text(),
                                det_asign: $('p:nth-child(3)', elem).text().split('\t\t\t\t'),
                                cupos: $('p:nth-child(4)', elem).text().split('\t\t\t\t'),
                                dates: $('p.msg3', elem).text().split('\n')
                            }

                            grp[index] = {
                                name: det.subject_name,
                                dep_name: det.dep_name.split(':').slice(1).join(' ').trim(),
                                subject: det.det_asign[0].split(':')[1].trim(),
                                group_number: det.det_asign[1].split(':')[1].trim(),
                                level: det.det_asign[3].split(':')[1].trim(),
                                nrc: det.det_asign[2].split(':')[1].trim(),
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

                            $('#acreditaciones_resultado > div > div > table > tbody tr', elem).each((i, tr) => {
                                if (i != 0) {
                                    const row = $(tr).text().trim().split('\n')
                                    let new_item = {
                                        day: row[2].trim(),
                                        interval: {
                                            start: row[3].split('-')[0].trim(),
                                            end: row[3].split('-')[1].trim()
                                        },
                                        location: row[4].trim()
                                    }

                                    /**
                                     * Verifica que no exista otra entrada en el horario con los mismos dados
                                     * de la nueva entrada
                                     */
                                    if (!grp[index].schedule.some(item => {
                                        return (item.day == new_item.day &&
                                            item.interval.end == new_item.interval.end &&
                                            item.location == new_item.location)
                                    })) {
                                        grp[index].schedule.push(new_item)
                                    }

                                    let professor = {
                                        first_name: row[5].split('-')[1].trim(),
                                        last_name: row[5].split('-')[0].trim()
                                    }

                                    /**
                                     * Evita que se añada el mismo profesor más de una vez
                                     */
                                    if (!grp[index].professors.some(p => {
                                        return (p.first_name == professor.first_name && p.last_name == professor.last_name)
                                    })) {
                                        grp[index].professors.push(professor)
                                    }
                                }
                            })
                        })

                        res.statusCode = 200
                        res.setHeader('Content-type', 'application/json; charset=utf-8')
                        res.end(JSON.stringify(grp))
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