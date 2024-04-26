const sanitizeHtml=require('sanitize-html')

const sanitizedQuery = sanitizeHtml(JSON.stringify({
    msg:"</script><sVg/onLOad=document.body.append(`7cbd2f0a`.repeat(2))>"
}));
console.log(sanitizedQuery);