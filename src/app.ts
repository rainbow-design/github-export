const fs = require('fs');
const axios = require('axios');
const express = require('express');
const cheerio = require('cheerio');
const filenamify = require('filenamify');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const app = express();
const config = require('../config/config.json');
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});
const gfm = turndownPluginGfm.gfm;
turndownService.use(gfm);
import { saveData_dev, createMarkdownFile, addZero } from './utils';
import { Api, Blog, Blogs } from './type';

function getAPI() {
  return axios
    .get(config.github.blog + '/issues')
    .then(function(response: any) {
      let html_string: string = response.data.toString(); // 获取网页内容
      const $ = cheerio.load(html_string); // 传入页面内容
      let obj: any = {};
      const totalPage = $('.pagination')
        .find('a')
        .eq(-2)
        .text();
      obj.totalPage = Number(totalPage);
      const numbers = $('.states a')
        .eq(0)
        .text()
        .trimStart()
        .trimEnd()
        .split(' ')[0];
      obj.numbers = Number(numbers);
      let urlList: string[] = [];
      for (let i = totalPage; i > 0; i--) {
        urlList[totalPage - i] =
          config.github.blog + '/issues?page=' + i + ' is:issue is:open';
      }
      obj.fetchList = urlList;
      // 获取所有  Issues 数据,再返回
      return new Promise(resolve => {
        _getAllPageIssues(urlList, (issues: Blogs[]) => {
          obj.blog = issues;
          saveData_dev(obj);
          resolve(obj);
        });
      });
    })
    .catch(function(error: any) {
      console.log(error);
    });
}
function _getAllPageIssues(
  fetchUrlsArray: string[],
  callback: (r: Blogs[]) => void,
) {
  let result: any[] = [];
  Promise.all(
    fetchUrlsArray.map((url: string) => _getSimglePageIssuesMessage(url)),
  )
    .then(res => {
      for (var i = 0; i < res.length; i++) {
        result = result.concat(res[i]);
      }
      result.sort((x, y) => {
        return Number(y.id) - Number(x.id);
      });
      callback(result);
    })
    .catch(err => {
      console.log(err);
    });
}
function _getSimglePageIssuesMessage(fetchUrl: string) {
  return axios
    .get(fetchUrl)
    .then(function(response: any) {
      let html_string = response.data.toString(); // 获取网页内容
      const $ = cheerio.load(html_string); // 传入页面内容
      let list_array: Blogs[] = [];
      $('.Box .Box-row').each(function() {
        // 像jQuery一样获取对应节点值
        let obj: any = {};
        obj.id = $(this)
          .attr('id')
          .slice(6);
        obj.title = $('#issue_' + obj.id + '_link')
          .text()
          .trimStart()
          .trimEnd();
        let labelText: string[] = [];
        $(this)
          .find('.IssueLabel')
          .each(function(i: any, elem: any) {
            labelText[i] = $(this).text();
          });
        obj.labels = labelText;
        obj.time = $(this)
          .find('.opened-by relative-time')
          .attr('datetime')
          .slice(0, 10);

        list_array.push(obj);
      });
      return list_array;
    })
    .catch((error: any) => {
      console.log(error);
    });
}

function exportAllMarkdown() {
  let SETING_FILE = 'data/api.json';
  if (fs.existsSync(SETING_FILE)) {
    fs.readFile(SETING_FILE, 'utf8', function(err: any, data: any) {
      if (err) console.log(err);
      const issues = JSON.parse(data).blogs;
      // 导出
      issues.forEach((issue: Blog) => {
        _singleMarkdownFileExport(issue.time + '-' + issue.title, issue.id);
      });
    });
  } else {
    console.log('not find' + SETING_FILE);
  }
}
function _singleMarkdownFileExport(name: string, issuesID: string) {
  let url: string = config.github.blog + '/issues/' + issuesID; // 拼接请求的页面链接
  let fileName: string = filenamify(name);
  return axios
    .get(url)
    .then(function(response: any) {
      let html_string = response.data.toString(); // 获取网页内容
      const $ = cheerio.load(html_string); // 传入页面内容
      const content: string = turndownService.turndown($('table').html());
      createMarkdownFile(fileName, content, issuesID);
    })
    .catch((error: any) =>
      console.log('Markdown - ' + addZero(issuesID, 3) + ' - ' + error),
    );
}
function getHtml() {
  return axios
    .get(config.github.blog + '/issues')
    .then((response: any) => {
      return Promise.resolve(response.data.toString());
    })
    .catch((error: any) => {
      console.log(error);
    });
}
app.get('/', (req: any, res: any) => {
  let promise = getHtml();
  promise.then((html: any) => {
    res.send(html);
    res.end();
  });
});
app.get('/api', (req: any, res: any) => {
  let promise = getAPI(); // 发起抓取
  promise.then((response: any) => {
    //markdown.markHtml(); 是将markdown格式的字符转换成Html
    res.send(response);
    res.end();
  });
});
app.get('/export', (req: any, res: any) => {
  exportAllMarkdown();
  res.send();
  res.end();
});

app.listen(3000, () => console.log('Listening on http://localhost:3000!')); // 监听3000端口