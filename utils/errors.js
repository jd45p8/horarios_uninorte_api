exports.errors = {
    somethingWentWrong: res => {
        res.statusCode = 500
        res.setHeader('Content-type', 'text/html')
        res.end('<h1>500, something went wrong!</h1>')
    },
    notFound: res => {
        res.statusCode = 404
        res.setHeader('Content-type', 'text/html')
        res.end('<h1>404, path not found!</h1>')
    },    
    methodNotAllowed: res => {
        res.statusCode = 405
        res.setHeader('Content-type', 'text/html')
        res.end('<h1>405, method not allowed!</h1>')
    }
}