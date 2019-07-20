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
         * de la asignatura y el periodo, ejemplo: /grupos/cur?dep_code=0047&period=201930&level=PR
         * subj_code: es el código de asignatura, con el que se agrupa el conjunto de asignaturas dentro del que se encuentra
         * la asignatura a la que pertenecen los grupos que se buscan,
         * course: es el curso, que identifica una asignatura, dentro del conjunto de asignaturas al que pertenecen 
         * los grupos que se buscan,
         * dep_code: es el código del departamento del que se requieren el grupo,
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
                departamento: reqData.dep_code,
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
                    const iconv = new Iconv('ISO-8859-1','UTF-8')
                    const html = iconv.convert(Buffer.concat(chunks))

                    const $ = cheerio.load(html)
                    let grp_det = {}

                    res.statusCode = 200
                    res.setHeader('Content-type', 'text/html; charset=utf-8')
                    res.end(html.toString())
                    return
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