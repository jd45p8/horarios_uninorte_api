const http = require('http')
const os = require('os')
const url = require('url')
const routes = require('./routes').routes
const errors = require('./utils/errors').errors

const routeNames = Object.keys(routes)
const nics = os.networkInterfaces()
const port = process.env.PORT || 8080
const hostnames = Object.keys(nics).map(
    hostname => nics[hostname][0].address)

const server = http.createServer((req, res) => {
    const urlParsed = url.parse(req.url)
    if (req.url === '/favicon.ico') {
        res.statusCode = 200
        res.setHeader('Content-type', 'image/x-icon')
        res.end()
    } else if (routeNames.includes(urlParsed.pathname)) {
        const methods = Object.keys(routes[urlParsed.pathname].methods)
        if (methods.includes(req.method)) {
            const method = routes[urlParsed.pathname].methods[req.method]
            method(req,res)
        } else {
            errors.methodNotAllowed(res)
        }
    } else {
        errors.notFound(res)
    }

})

server.listen(port, () => {
    hostnames.map(hostname => console.log(`Server is runing at http://${hostname}:${port}`))
})