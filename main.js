const dbManage= require('./database/dbManage');
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs= require('querystring');

function templateHTML(title, list, body) {
    return `
    <!doctype html>
    <html>
        <head>
            <title>WEB1 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1><a href="/">WEB</a></h1>
            ${list}
            <a href="/create">create</a>
            ${body}
        </body>
    </html>
    `;
}

function templateList(filelist) {
    var list = '<ul>';
    var i = 0;
    while(i < filelist.length) {
        list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
        i = i + 1;
    }
    list = list+'</ul>';
    return list;
}

var app = http.createServer(function(request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if(pathname === '/') {
        if(queryData.id === undefined) {
            fs.readdir('./data', function(error, filelist) {
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = templateList(filelist);
                var template = templateHTML(title, list, `<h2>${title}</h2><p>${description}</p>`);
                response.writeHead(200);
                response.end(template);
            });
        } else {
            fs.readdir('./data', function(error, filelist) {
                fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description) {
                    var title = queryData.id;
                    var list = templateList(filelist);
                    var template = templateHTML(title, list, `<h2>${title}</h2><p>${description}</p>`);
                    response.writeHead(200);
                    response.end(template);
                });
            });
        }
    } else if(pathname === '/create') {
        fs.readdir('./data', function(error, filelist) {
            var title = 'WEB - create';
            var list = templateList(filelist);
            var template = templateHTML(title, list, `
                <form action="http://localhost:3000/create_process" method="post">
                    <p><input type="text" name="title" placeholder="제목"></p>
                    <p>
                        <textarea name="description" placeholder="내용"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
            `);

            dbManage.insertPost();
            response.writeHead(200);
            response.end(template);
        });
    } else if(pathname=== '/create_process') {
      var body= '';

      request.on('data', function(data) {
        body= body+ data;
      });

      request.on('end', function() {
        var post= qs.parse(body);
        var title= post.title;
        var description= post.description;

        // insert data to mysql db
        dbManage.insertPost(title, description,
          function(err, result) {
            if(err) {
              console.error(err);

              response.writeHead(500);
              response.end('Internal Server Error');
            } else {
              console("데이터를 추가했습니다.");
              
              response.writeHead(302, {'Location': '/'});
              response.end();
            }
          });
      });
      
    }
    else {
      response.writeHead(404);
      response.end('Not found');
  }
});
app.listen(3000);
