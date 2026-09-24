import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import JSZip from "jszip";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

function safeName(s="Hoc vien"){
  return String(s).replace(/[\\/:*?"<>|]/g,"").trim() || "Hoc vien";
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const reports=req.body?.reports;
  if(!Array.isArray(reports)||!reports.length) return res.status(400).json({error:"Không có báo cáo để xuất."});

  let browser;
  try{
    browser=await puppeteer.launch({
      args: chromium.args,
      defaultViewport:{width:1123,height:1588,deviceScaleFactor:1},
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const zip=new JSZip();
    const page=await browser.newPage();

    for(const item of reports){
      await page.setContent(item.html,{waitUntil:"networkidle0"});
      await page.emulateMediaType("print");
      const pdf=await page.pdf({
        width:"210mm",
        height:"297mm",
        printBackground:true,
        preferCSSPageSize:true,
        margin:{top:"0mm",right:"0mm",bottom:"0mm",left:"0mm"}
      });
      zip.file(`${safeName(item.name)}.pdf`,pdf);
    }

    const out=await zip.generateAsync({type:"nodebuffer",compression:"DEFLATE"});
    res.setHeader("Content-Type","application/zip");
    res.setHeader("Content-Disposition",`attachment; filename="OIEC-Monthly.zip"`);
    return res.status(200).send(out);
  }catch(e){
    return res.status(500).json({error:"Không tạo được PDF/ZIP: "+e.message});
  }finally{
    if(browser) await browser.close();
  }
}