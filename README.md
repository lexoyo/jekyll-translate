
Command line tool to translate a wole jekyll site with google translate. This will translate posts or pages, including title meta data and file name.

```sh
$ npm install -g jekyll-translate
$ jekyll-translate _posts/ _fr/ "(.*)\.md" fr en $GOOGLE_TRANSLATE_API_KEY
```
params:

* source folder (_posts/ in the example) with the files in the source language
* destination folder (_fr/ in the examples, need to exist) will contain the translated files
* regular expression ("(.*)\.md" in the example) which will be used against the file name to select the files to be translated
* source language code ('fr')
* destination language code ('en')
* Google translate API key

