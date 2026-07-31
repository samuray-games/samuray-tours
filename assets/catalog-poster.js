(function(){
  "use strict";

  var D=window.SAMURAY_TOUR_CATALOG;
  if(!D)return;

  var ids=Object.keys(D);
  var m=document.getElementById("modalContent");
  var g=document.getElementById("grid");
  var current=null;
  var busy=false;
  var timer=null;

  var M={
    torii:["⛩️","ТОРИИ","#71131b","#e36d32"],
    fashion:["🧥","УЛИЧНАЯ МОДА","#73298c","#ff5ca8"],
    crossing:["🚥","ПЕРЕКРЁСТОК","#183d72","#5aa2ff"],
    lantern:["🏮","КАМИНАРИМОН","#8a1420","#f09a31"],
    temple:["🏯","ХРАМ","#5b2c20","#dca85f"],
    tower:["🗼","БАШНЯ","#202c4d","#ec3e52"],
    station:["🏛️","СТАНЦИЯ ТОКИО","#7a3225","#d88b58"],
    sushi:["🍣","СУШИ","#087b68","#f0ba39"],
    market:["🧺","РЫНОК","#6c3621","#ef8b42"],
    skyline:["🏙️","ТОКИО","#25364e","#7aa0ce"],
    arcade:["🕹️","АРКАДЫ","#49207e","#ff2f9f"],
    cat:["🐈","ЯНАКА","#4c352b","#c98b5b"],
    garden:["🌿","САД","#1f6637","#8fcf55"],
    flower:["🌸","САКУРА","#b82f78","#ffd0e4"],
    ramen:["🍜","РАМЭН","#9f241d","#ff9e2c"],
    maple:["🍁","МОМИДЗИ","#7b1d13","#f17623"],
    neon:["🌃","НЕОН","#11142f","#d6248a"],
    alley:["🏮","ПЕРЕУЛКИ","#252138","#b23f5c"],
    palace:["🏯","ДВОРЕЦ","#243470","#c9a63c"],
    bridge:["🌉","МОСТ","#086c78","#49c5e8"],
    sea:["🌊","БЕРЕГ","#075a86","#51c1e8"],
    robot:["🤖","ГАНДАМ","#34414d","#e8e8e8"],
    mic:["🎤","КАРАОКЕ","#5a168d","#ff3e8c"],
    fuji:["🗻","ФУДЗИ","#2364a8","#b9e0ff"],
    family:["👨‍👩‍👧","СЕМЕЙНЫЙ ТОКИО","#087b70","#ffc14f"]
  };

  var motifOverrides={
    architecture:["skyline","station","tower"],
    express:["tower","temple","crossing"],
    imperial:["palace","garden","skyline"]
  };

  function attr(n,names){
    while(n&&n!==document){
      if(n.getAttribute){
        for(var i=0;i<names.length;i++){
          var v=n.getAttribute(names[i]);
          if(v)return v;
        }
      }
      n=n.parentNode;
    }
    return null;
  }

  function clickId(n){
    var x=attr(n,["data-fallback-detail","data-catalog25-detail","data-detail-apply","data-tour-id"]);
    if(x)return x;
    while(n&&n!==document){
      if(n.getAttribute){
        var q=(n.getAttribute("onclick")||"").match(/(?:openTour|openApply)\(\s*['\"]([^'\"]+)['\"]\s*\)/);
        if(q)return q[1];
      }
      n=n.parentNode;
    }
    return null;
  }

  function modalId(){
    var p=m&&m.querySelector(".tour-detail-poster[data-tour-poster-id]");
    if(p&&D[p.getAttribute("data-tour-poster-id")])return p.getAttribute("data-tour-poster-id");
    var u=new URL(location.href).searchParams.get("tour");
    if(u&&D[u])return u;
    if(current&&D[current])return current;
    var h=m&&m.querySelector("h2");
    if(h){
      for(var i=0;i<ids.length;i++){
        if(D[ids[i]].title===h.textContent.trim())return ids[i];
      }
    }
    return null;
  }

  function node(tag,cls,text){
    var n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!=null)n.textContent=text;
    return n;
  }

  function motifCard(type){
    var v=M[type]||["🗼","ТОКИО","#25364e","#9d2633"];
    var c=node("div","tour-motif-card");
    c.setAttribute("data-motif",type||"tokyo");
    c.style.setProperty("--motif-a",v[2]);
    c.style.setProperty("--motif-b",v[3]);
    c.appendChild(node("div","tour-motif-icon",v[0]));
    c.appendChild(node("div","tour-motif-label",v[1]));
    return c;
  }

  function poster(id,t,desc){
    var p=node("div","tour-detail-poster");
    p.setAttribute("data-tour-poster-id",id);
    p.setAttribute("data-title-exact",t.title);
    p.setAttribute("data-description",desc);
    p.setAttribute("role","img");
    p.setAttribute("aria-label",t.title);
    p.style.setProperty("--poster-c1",t.colors[0]);
    p.style.setProperty("--poster-c2",t.colors[1]);

    var top=node("div","tour-poster-top");
    var brand=node("div","tour-poster-brand");
    brand.appendChild(node("span","tour-brand-base","SAMU"));
    brand.appendChild(node("span","tour-brand-ray","RAY"));
    brand.appendChild(node("span","tour-brand-base"," TOURS"));
    top.appendChild(brand);

    var title=node("div","tour-poster-title");
    title.appendChild(node("span","tour-poster-title-text",t.title));
    top.appendChild(title);

    var stage=node("div","tour-poster-artstage");
    var motifs=(t.motifs||[]).slice(0,3);
    while(motifs.length<3)motifs.push("skyline");
    for(var i=0;i<3;i++)stage.appendChild(motifCard(motifs[i]));
    top.appendChild(stage);
    p.appendChild(top);

    var copy=node("div","tour-poster-copy");
    copy.style.background="linear-gradient(110deg,#27313c 0%,"+t.colors[0]+" 150%)";
    copy.appendChild(node("span","tour-poster-copy-text",desc));
    p.appendChild(copy);
    return p;
  }

  function noBreakMoney(s){
    return String(s).replace(/([+]?\d+) (\d{3}) ₽/g,"$1\u00a0$2\u00a0₽");
  }

  function formatFullPrice(s){
    return noBreakMoney(String(s)).replace(/\s+\(/,"\n(").replace(/\);\s*/, ")\n");
  }

  function renderPrice(b,text){
    if(b.textContent!==text)b.textContent=text;
    b.setAttribute("data-canonical-price",text);
    b.setAttribute("data-price-layout","v5");
  }

  function patchData(){
    for(var i=0;i<ids.length;i++){
      var id=ids[i];
      var t=D[id];
      if(motifOverrides[id])t.motifs=motifOverrides[id].slice();
      if(!Object.prototype.hasOwnProperty.call(t,"typeLabel")){
        t.typeLabel=t.badge;
        t.rawDuration=t.duration;
        t.duration=t.duration+" • "+t.badge;
        t.badge="";
      }
      t.fullPrice=formatFullPrice(t.fullPrice);
    }
  }

  function patchCards(){
    if(!g)return;
    var cards=g.querySelectorAll(".card");
    for(var i=0;i<cards.length;i++){
      var c=cards[i];
      var id=c.getAttribute("data-tour-id");
      if(!id||!D[id])continue;
      var s=c.querySelectorAll(".meta span");
      if(s[0]&&s[0].textContent!==D[id].duration)s[0].textContent=D[id].duration;
      if(s[1])s[1].classList.add("tour-meta-type-hidden");
    }
  }

  function patchModal(){
    if(!m||busy)return;
    var id=modalId();
    var t=id&&D[id];
    if(!t)return;
    var lead=m.querySelector(".lead");
    var old=m.querySelector(".tour-detail-cover[data-tour-cover-id='"+id+"']")||m.querySelector(".tour-detail-cover");
    if(!lead||!old)return;

    busy=true;
    try{
      var desc=lead.textContent.trim();
      var h=m.querySelector("h2");
      if(h){
        h.classList.add("tour-detail-title-hidden");
        h.setAttribute("aria-hidden","true");
      }
      var source=lead.closest?lead.closest(".tour-detail-intro"):lead.parentNode;
      if(source)source.classList.add("tour-poster-source");
      var existing=m.querySelector(".tour-detail-poster");
      if(!existing||existing.getAttribute("data-tour-poster-id")!==id||existing.getAttribute("data-description")!==desc||existing.getAttribute("data-title-exact")!==t.title){
        if(existing)existing.remove();
        source.parentNode.insertBefore(poster(id,t,desc),source);
      }
      var info=m.querySelectorAll(".info");
      for(var i=0;i<info.length;i++){
        var sm=info[i].querySelector("small");
        var b=info[i].querySelector("b");
        if(!sm||!b)continue;
        var label=sm.textContent.trim();
        if(label==="Длительность"&&b.textContent!==t.duration)b.textContent=t.duration;
        if(label==="Стоимость"&&(b.getAttribute("data-price-layout")!=="v5"||b.textContent!==t.fullPrice))renderPrice(b,t.fullPrice);
      }
    }finally{
      busy=false;
    }
  }

  function schedule(id){
    if(id&&D[id])current=id;
    clearTimeout(timer);
    timer=setTimeout(function(){patchCards();patchModal();},30);
    setTimeout(function(){patchCards();patchModal();},160);
  }

  function audit(){
    var issues=[];
    if(ids.length!==25)issues.push("catalog count "+ids.length);
    for(var i=0;i<ids.length;i++){
      var id=ids[i];
      var t=D[id];
      var p=poster(id,t,"Мини-описание");
      if(p.querySelector(".tour-poster-title-text").textContent!==t.title)issues.push(id+": title changed");
      if(p.querySelectorAll(".tour-motif-card").length!==3)issues.push(id+": motif count");
      if(!t.typeLabel||t.duration.indexOf(" • "+t.typeLabel)===-1)issues.push(id+": type not beside duration");
      if(p.querySelector(".tour-brand-ray").textContent!=="RAY")issues.push(id+": RAY missing");
      if(p.querySelector(".tour-poster-copy-text").textContent!=="Мини-описание")issues.push(id+": description missing");
      if((t.motifs||[]).indexOf("train")!==-1)issues.push(id+": train motif remains");
    }
    var d=node("b");
    var price=formatFullPrice("15 900 ₽ за группу до 4 человек (+2 000 ₽ за каждого следующего гостя)");
    renderPrice(d,price);
    if(d.textContent.indexOf("\n(+2\u00a0000\u00a0₽")===-1||d.querySelector("span"))issues.push("price layout");
    if(M.robot[1]!=="ГАНДАМ")issues.push("Gandam spelling");
    if(M.crossing[1]!=="ПЕРЕКРЁСТОК")issues.push("crossing label");
    window.SAMURAY_COVER_AUDIT={ok:issues.length===0,count:ids.length,issues:issues};
    if(issues.length)console.error("SAMURAY_COVER_AUDIT",issues);
  }

  patchData();
  audit();
  patchCards();
  addEventListener("click",function(e){var id=clickId(e.target);if(id)schedule(id);},true);
  addEventListener("popstate",function(){schedule(new URL(location.href).searchParams.get("tour"));});
  if(g)new MutationObserver(function(){schedule(null);}).observe(g,{childList:true,subtree:true});
  if(m)new MutationObserver(function(){schedule(null);}).observe(m,{childList:true,subtree:true});
  schedule(new URL(location.href).searchParams.get("tour"));
})();