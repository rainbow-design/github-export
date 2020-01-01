import { $axios } from './index';
import { saveData_dev } from '../src/utils';

function getAPI(url: string) {
  $axios.get(url).then((result: any) => {
    console.log(result.data.length);
    console.log(result.headers.link);
    getResult(getPageRequestList(result.headers.link));
  });
}

function getPageRequestList(str: string) {
  let lastPage = str
    .match(/<(.+?)>/g)[1]
    .slice(1, -1)
    .split('=');
  let result = [];
  let href = lastPage[0];
  for (let i = 1; i <= Number(lastPage[1]); i++) {
    result.push(href + '=' + i);
  }
  return result;
}

function getResult(fetchList: string[]) {
  let obj: any = [];
  let folling_obj: any = [];
  return Promise.all(fetchList.map(url => $axios.get(url))).then(
    (...res: any) => {
      let stars = res[0];
      for (let m = 0; m < stars.length; m++) {
        obj = obj.concat(stars[m].data);
      }
      console.log(obj.length);
      for (let n = 0; n < obj.length; n++) {
        let star = obj[n];
        folling_obj.push({
          name: star.login,
          url: star.html_url,
          repos_url: star.repos_url,
          avatar_url: star.avatar_url,
        });
      }
      console.log(folling_obj);

      saveData_dev(folling_obj, 'following.json');
    },
  );
}

getAPI('https://api.github.com/users/yanyue404/following');