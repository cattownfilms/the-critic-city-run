"""Load exact single-file HTML in bounded chunks (avoids oversized CDP message limit)."""
def load_html(page,html,storage=True):
 code='window.__testStore={};Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>window.__testStore[k]??null,setItem:(k,v)=>window.__testStore[k]=String(v),removeItem:k=>delete window.__testStore[k]}});' if storage else 'Object.defineProperty(window,"localStorage",{configurable:true,get:()=>{throw new Error("storage unavailable")}});'
 html=html.replace('<head>','<head><script>'+code+'</script>')
 page.evaluate('document.open()')
 for start in range(0,len(html),512*1024):page.evaluate('part=>document.write(part)',html[start:start+512*1024])
 page.evaluate('document.close()')
 page.wait_for_function('window.__brawler?.ready()',timeout=60000)
