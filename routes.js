const https = require('https')
const DOMParser = require('dom-parser')

exports.routes = {
    '/departamentos': {
        methods: {
            GET: (req, res) => {
                const options = {
                    hostname: 'www.uninorte.edu.co',
                    port: 443,
                    path: '/web/matriculas/horarios',
                    method: 'GET'
                }

                const extReq = https.request(options, extRes => {
                    var chunks = []
                    extRes.on('data', data => {
                        chunks.push(data)
                    })

                    extRes.on('end', () => {
                        const parser = new DOMParser()
                        const html = Buffer.concat(chunks).toString()

                        const doc = parser.parseFromString(html, 'text/html')
                        const body = doc.getElementsByTagName('body')[0]                 
                        console.log(body.innerHTML)

                        res.statusCode = 200
                        res.setHeader('Content-type','text/html')
                        res.end(html)
                        return                 
                    })
                })

                
                extReq.on('error', error => {
                    res.statusCode = 500
                    res.setHeader('Content-type', 'text/html')
                    res.end('<h1>500, something went wrong!</h1>')
                    return
                })
                
                extReq.end()
            }
        }
    }
}