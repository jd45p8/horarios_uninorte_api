const https = require('https')
const cheerio = require('cheerio')
const querystring = require('querystring')
const Iconv = require('iconv').Iconv
const url = require('url')
const somethingWentWrong = require('../utils/errors').errors.somethingWentWrong

exports.grupos_subj_det = {
    methods: {
        /**
         * Retorna los grupos que pertenecen a una asignatura dado el código de la asignatura, el curso, el nivel académico 
         * de la asignatura y el periodo, ejemplo: /grupos/subj/det?period=201930&level=PR&subj_code=IST&course=2088
         * subj_code: es el código de asignatura, con el que se agrupa el conjunto de asignaturas dentro del que se encuentra
         * la asignatura a la que pertenecen los grupos que se buscan,
         * course: es el curso, que identifica una asignatura, dentro del conjunto de asignaturas al que pertenecen 
         * los grupos que se buscan,
         * period: es el periodo para el cuál se necesitan el grupo,
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
                mat2: reqData.subj_code,
                curso: reqData.course,
                datos_periodo: reqData.period,
                datos_nivel: reqData.level
            }
            const query = querystring.stringify(data)

            const options = {
                hostname: 'guayacan.uninorte.edu.co',
                port: 443,
                path: '/registro/resultado_curso1.asp',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(query)
                }
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
                    let grp = {}
                    try {
                        $('body > div').each((index, elem) => {
                            const det = {
                                subject_name: $('p.msg1', elem).text(),
                                dep_name: $('p:nth-child(2)', elem).text(),
                                det_asign: $('p:nth-child(3)', elem).text().split('\n\t\t\t'),
                                cupos: $('p:nth-child(6)', elem).text().split('\n\t\t\t'),
                                dates: $('p.msg3', elem).text().split('\n')
                            }

                            grp[index] = {
                                name: det.subject_name,
                                dep_name: det.dep_name.split(':').slice(1).join(' ').trim(),
                                subject: det.det_asign[0].split(':')[1].trim(),
                                group_number: det.det_asign[1].split(':')[1].trim(),
                                level: $(elem).contents().not($(elem).children()).text().trim(),
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
                                        first_name: row[5].split(',')[1].trim(),
                                        last_name: row[5].split(',')[0].trim()
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