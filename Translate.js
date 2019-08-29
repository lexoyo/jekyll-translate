const fs = require('fs.promised');
const dirTree = require('directory-tree');
const googleTranslate = require('google-translate');
const matter = require('gray-matter');

module.exports = class Translate {
  // { apikey, keepIndent, preservedProperties }
  constructor(options) {
    this.options = options;
    this.client = googleTranslate(options.apiKey);
  }
  async translate(strings, opt_srcLang, distLang) {
    return new Promise((resolve, reject) => {
      const cbk = (err, translations) => {
        //console.log('translation service result', err ? err : translations);
        if(err) {
          try {
            const e = JSON.parse(err.body).error;
            reject(e);
          }
          catch(err2) {
            console.warn('could not parse error object', err2);
            reject(err);
          }
        }
        else resolve(translations);
      };
      if(opt_srcLang) this.client.translate(strings, opt_srcLang, distLang, cbk);
      else this.client.translate(strings, distLang, cbk);
    });
  }
  flatten(obj) {
    return Object.keys(obj).flatMap(key => {
      const prop = obj[key];
      if(this.options.preservedProperties.find(preserved => preserved === key)) {
        // console.log('preserved', key, prop, this.options.preservedProperties);
        return null;
      }
      else if(prop && typeof prop === 'object') {
        return this.flatten(prop);
      }
      else if(prop && typeof prop === 'string') {
        return this.prepare(prop);
      }
      return null
    }).filter(el => !!el);
  }
  // replaceTranslations(obj, arr) {
  //   Object.keys(obj).forEach(key => {
  //     const prop = obj[key];
  //     if(this.options.preservedProperties.find(preserved => preserved === key)) {
  //       // console.log('preserved', key, prop);
  //       return null;
  //     }
  //     else if(prop && typeof prop === 'object') {
  //       this.replaceTranslations(prop, arr);
  //     }
  //     else if(prop && typeof prop === 'string') {
  //       const prepared = this.prepare(prop);
  //       const trObj = arr.find(trObj => prepared === trObj.originalText)
  //       if(trObj) obj[key] = this.cleanup(trObj.translatedText);
  //     }
  //   });
  // }
  cleanup(text) {
    // if(this.options.keepIndent != true) return text;
    return text.replace(/\*\* (.*?) \*\*/g, (match, p1, p2, p3) => {
      return `**${ p1 }**`;
    })
    .replace(/<br \/> /g, '\n')
    .replace(/\] \(/g, '](')
    .replace(/\(# /g, '(#')
    .replace(/en# /g, 'en#')
    .replace(/ \/ /g, '/')
    .replace(/! \[/g, '![')
    .replace(/\s+(?=[^(\)]*\))/g, '') // remove white space in the links
  }
  prepare(text) {
    // if(this.options.keepIndent != true) return text;
    return text
    // .replace(/ \*\*/g, '___xxxxx___')
    // .replace(/\*\* /g, '___yyyyy___')
    // .replace(/\*\*/g, '___zzzzz___')
    .replace(/\*\*/g, '')
    .replace(/\n( *)/g, (match, p1, p2, p3) => {
      return `<br />${ p1
        // .replace(' ', '___space___') 
      }`;
    });
  }
  async translateFile(srcPath, opt_distPath, opt_srcLang, distLang) {
    const buffer = await fs.readFile(srcPath);
    const text = buffer.toString();
    const obj = matter(text);
    const arr = [obj.content, obj.data.title || '']; //.concat(this.flatten(obj.data));
    const translated = await this.translate(arr, opt_srcLang, distLang);
    // console.log('*****', translated);
    // this.replaceTranslations(obj, translated);
    obj.content = this.cleanup(translated[0].translatedText);
    if(obj.data.title) obj.data.title = translated[1].translatedText;
    const md = matter.stringify(obj);
    if(opt_distPath) {
      await fs.writeFile(opt_distPath, md)
      console.log(`Translation done for ${srcPath}:`, md);
      return md;
    }
    else {
      console.log(`Translation done for ${srcPath}:`, md, '(NOT WRITTEN)');
      return md;
    }
  }
  async translateJekyll(path, outPath, opt_srcLang, distLang, reg) {
    const files = [];
    dirTree(path, { extensions: reg }, item => {
      files.push(item);
    });
    for(var idx in files) {
      const item = files[idx];
      const {translatedText} = await this.translate(item.name.replace(/_/g, ' '), opt_srcLang, distLang);
      item.newName = translatedText
      .replace(/ /g, '_') // put back the _ for space
      .replace(/[\?']/g, '') // remove unwanted chars
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .toLowerCase()
      console.log('Translating', item.name, '=>', item.newName)
    }
    return Promise.all(files
      .map(file => {
        return {
          src: file.path,
          dst: outPath + file.newName,
        };
      })
      .map(file => this.translateFile(file.src, file.dst, opt_srcLang, distLang))
    );
  }
}
