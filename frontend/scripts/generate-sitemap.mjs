import fs from 'node:fs'
const base=process.env.SITE_URL
if(!base)throw new Error('Set SITE_URL to the public HTTPS website origin before generating the sitemap.')
const origin=new URL(base)
if(origin.protocol!=='https:')throw new Error('SITE_URL must be HTTPS.')
const paths=['/','/tours','/destinations','/experiences','/about','/contact','/faq']
for(const [file,prefix] of [['journeys','/journeys/'],['experiences','/experiences/'],['tips','/destinations/']]){
 const published=new URL('../../backend/App_Data/WebsiteContent/'+file+'.json',import.meta.url)
 const seed=new URL('../../backend/Data/WebsiteContent/'+file+'.json',import.meta.url)
 for(const item of JSON.parse(fs.readFileSync(fs.existsSync(published)?published:seed)))paths.push(prefix+item.slug)
}
fs.writeFileSync(new URL('../public/sitemap.xml',import.meta.url),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>'+new URL(p,origin.origin).href+'</loc></url>').join('')+'</urlset>')
fs.writeFileSync(new URL('../public/robots.txt',import.meta.url),'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nSitemap: '+origin.origin+'/sitemap.xml\n')
console.log('Generated sitemap and robots.txt for '+origin.origin)
