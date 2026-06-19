const fs=require('fs'),path=require('path'),https=require('https')
const DATA='./data',LOG=path.join(DATA,'verification-log.json')
const httpHead=u=>new Promise(r=>https.request(u,{method:'HEAD'},res=>{res.destroy();r(res.statusCode)}).on('error',()=>r(0)).end())
async function main(){
  const all=[],walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{
    const p=path.join(d,e.name)
    if(e.isDirectory())walk(p)
    else if(e.name.endsWith('.json')&&!e.name.includes('verification'))all.push(p)
  })
  walk(DATA)
  const results=[]
  for(const f of all){
    try{
      const d=JSON.parse(fs.readFileSync(f,'utf8'))
      const url=d.legislation?.citation_url||''
      let status=0,ok=false
      if(url.startsWith('http')){try{status=await httpHead(url)}catch(e){}}
      ok=[200,301,302,304,307,308].includes(status)
      results.push({file:f,id:d.id||'',url,status,ok,in_force:d.legislation?.in_force??null,checkedAt:new Date().toISOString()})
    }catch(e){results.push({file:f,error:e.message})}
  }
  const out={lastRun:new Date().toISOString(),total:all.length,verified:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results}
  if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true})
  fs.writeFileSync(LOG,JSON.stringify(out,null,2))
  console.log(JSON.stringify(out,null,2))
}
main()
