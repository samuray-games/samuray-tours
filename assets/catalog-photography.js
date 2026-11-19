/* SamuRay Tours - editorial photo layer v1. No changes to prices, booking, or analytics. */
(function () {
  "use strict";
  var photos = {
    shibuya:  {file:"Shibuya crossing at night.jpg", credit:"Wikimedia Commons, CC0", license:"https://creativecommons.org/publicdomain/zero/1.0/", alt:"Пешеходный переход Сибуи в Токио"},
    asakusa:  {file:"Kaminari-mon.jpg", credit:"Marco Almbauer, CC0", license:"https://creativecommons.org/publicdomain/zero/1.0/", alt:"Красные ворота Каминаримон в Асакусе"},
    tsukiji:  {file:"Tsukiji Outer Market.jpg", credit:"Christophe95, CC BY-SA 4.0", license:"https://creativecommons.org/licenses/by-sa/4.0/", alt:"Внешний рынок Цукидзи"},
    ginza:    {file:"Ginza Wako Clock.jpg", credit:"JordyMeow, CC BY 3.0", license:"https://creativecommons.org/licenses/by/3.0/", alt:"Часовая башня Вако в Гиндзе"},
    akiba:    {file:"Akihabara Night.jpg", credit:"Wikimedia Commons, CC BY 4.0", license:"https://creativecommons.org/licenses/by/4.0/", alt:"Вечерние огни Акихабары"},
    yanaka:   {file:"Yanaka Ginza entrance.jpg", credit:"Wikimedia Commons, CC BY 4.0", license:"https://creativecommons.org/licenses/by/4.0/", alt:"Улицы старого Токио в Янаке"},
    shinjuku: {file:"2024-10-20 Shinjuku Golden Gai at night.jpg", credit:"Alexkom000, CC BY 4.0", license:"https://creativecommons.org/licenses/by/4.0/", alt:"Ночные переулки Голден Гай в Синдзюку"},
    classic:  {file:"Five-storied Pagoda and Tokyo Skytree.jpg", credit:"Wikimedia Commons, CC BY-SA 4.0", license:"https://creativecommons.org/licenses/by-sa/4.0/", alt:"Пятиэтажная пагода и Tokyo Skytree"},
    garden:   {file:"Koishikawa Korakuen.jpg", credit:"Wikimedia Commons, CC BY-SA 2.0", license:"https://creativecommons.org/licenses/by-sa/2.0/", alt:"Японский сад Коисикава Коракуэн"},
    sakura:   {file:"Cherry blossoms in Chidorigafuchi.jpg", credit:"Kirin7739, CC BY 4.0", license:"https://creativecommons.org/licenses/by/4.0/", alt:"Цветущая сакура у рва Чидоригафути"},
    station:  {file:"Tokyo Station Marunouchi building.jpg", credit:"Wikimedia Commons, CC0", license:"https://creativecommons.org/publicdomain/zero/1.0/", alt:"Кирпичный вокзал Tokyo Station"},
    bay:      {file:"Rainbow Bridge as seen from Odaiba at night.jpg", credit:"Dquai, CC BY-SA 4.0", license:"https://creativecommons.org/licenses/by-sa/4.0/", alt:"Радужный мост из Одайбы вечером"},
    fuji:     {file:"Fuji Kawaguchi 457.JPG", credit:"Wikimedia Commons, CC0", license:"https://creativecommons.org/publicdomain/zero/1.0/", alt:"Гора Фудзи и озеро Кавагути"},
    kamakura: {file:"The Great Buddha of Kamakura (Daibutsu).jpg", credit:"Wikimedia Commons, CC BY 2.0", license:"https://creativecommons.org/licenses/by/2.0/", alt:"Великий Будда Камакуры"},
    karaoke:  {file:"Room 601, Karaoke Kan, Tokyo.jpg", credit:"Wikimedia Commons", license:"https://commons.wikimedia.org/wiki/File:Room_601,_Karaoke_Kan,_Tokyo.jpg", alt:"Караоке-зал в Токио"}
  };
  var tourPhoto = {
    "3d":"shibuya", "asakusa":"asakusa", "tsukiji":"tsukiji", "akiba":"akiba",
    "yanaka":"yanaka", "architecture":"station", "gardens":"garden",
    "depachika":"ginza", "hanami":"sakura", "momiji":"garden",
    "season-express":"sakura", "season-special":"garden",
    "shinjuku":"shinjuku", "classic":"classic", "contrast":"ginza",
    "temples":"garden", "culinary":"tsukiji", "nightfull":"shinjuku",
    "express":"shibuya", "family":"asakusa", "imperial":"station",
    "odaiba":"bay", "karaoke":"karaoke", "kawaguchiko":"fuji", "kamakura":"kamakura"
  };
  var labels = {
    shibuya:"Современный Токио",asakusa:"Старый Токио",tsukiji:"Вкус Токио",
    ginza:"Элегантный Токио",akiba:"Город огней",yanaka:"Токио без спешки",
    shinjuku:"После заката",classic:"Два лица города",garden:"Тишина и история",
    sakura:"Сезон в Токио",station:"Архитектура города",bay:"Токио у воды",
    fuji:"За пределами столицы",kamakura:"Историческая Япония",karaoke:"Вечер в Токио"
  };
  var sheet = document.createElement("style");
  sheet.id="samuray-photo-layer-style";
  sheet.textContent=[
    ".card[data-photo-ready]{overflow:hidden;isolation:isolate;box-shadow:0 8px 34px rgba(32,27,23,.09);transition:transform .25s ease,box-shadow .25s ease}",
    ".card[data-photo-ready]:hover{transform:translateY(-5px);box-shadow:0 17px 40px rgba(32,27,23,.16)}",
    ".tour-photo-open{position:relative;display:block;width:calc(100% + 44px);height:clamp(190px,22vw,245px);margin:-22px -22px 21px;padding:0;border:0;border-radius:22px 22px 0 0;background:linear-gradient(135deg,#b5a18c,#374348);overflow:hidden;cursor:pointer;text-align:left}",
    ".tour-photo-open img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 48%;transition:transform .5s ease,filter .35s ease;filter:saturate(.93) contrast(1.04)}",
    ".card:hover .tour-photo-open img{transform:scale(1.045)}",
    ".tour-photo-open:after{content:'';position:absolute;inset:20% 0 0;background:linear-gradient(to top,rgba(16,18,21,.7),transparent 80%);pointer-events:none}",
    ".tour-photo-kicker{position:absolute;bottom:14px;left:17px;z-index:1;color:#fff;font:750 12px/1.2 Arial,sans-serif;letter-spacing:.08em;text-shadow:0 1px 7px #000}",
    ".tour-photo-kicker:before{content:'';display:inline-block;width:17px;height:3px;margin:0 8px 3px 0;border-radius:2px;background:#d84345}",
    ".tour-photo-open:focus-visible{outline:3px solid #b41622;outline-offset:-4px}",
    ".tour-detail-poster[data-photo-ready] .tour-poster-artstage{display:block;min-height:clamp(300px,42vw,470px);background-position:center 46%;background-size:cover;background-repeat:no-repeat;background-color:#34383b}",
    ".tour-detail-poster[data-photo-ready] .tour-poster-artstage:before{background:linear-gradient(to top,rgba(0,0,0,.20),transparent 45%)}",
    ".tour-detail-poster[data-photo-ready] .tour-motif-card{display:none}",
    ".tour-detail-poster[data-photo-ready] .tour-poster-top{padding-bottom:0}",
    ".tour-detail-poster[data-photo-ready] .tour-poster-title{margin-bottom:0}",
    ".tour-photo-credits{max-width:1130px;margin:-36px auto 56px;padding:0 16px;color:#706b63;font:12px/1.6 Arial,sans-serif}",
    ".tour-photo-credits summary{cursor:pointer;display:inline-block;border-bottom:1px dashed currentColor}",
    ".tour-photo-credits ul{columns:2;list-style:none;padding:6px 0 0;margin:8px 0}",
    ".tour-photo-credits li{break-inside:avoid;margin:0 0 6px}",
    ".tour-photo-credits a{color:#68433c}",
    "@media(max-width:620px){.tour-photo-open{height:220px}.tour-photo-credits ul{columns:1}.tour-detail-poster[data-photo-ready] .tour-poster-artstage{min-height:275px}}",
    "@media(prefers-reduced-motion:reduce){.tour-photo-open img,.card[data-photo-ready]{transition:none!important}}"
  ].join("\n");
  document.head.appendChild(sheet);
  function url(file) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(file.replace(/ /g,"_"))+"?width=1100";
  }
  function local(id) {
    return "assets/tour-photos/"+id+".webp";
  }
  function sourcePage(file) {
    return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(file.replace(/ /g,"_"));
  }
  function setImage(img, pid) {
    var p=photos[pid];
    if(!p) return;
    img.alt=p.alt;
    img.decoding="async";
    img.loading="lazy";
    img.setAttribute("data-photo-id",pid);
    img.onerror=function(){
      if(img.getAttribute("data-source-mode")!=="remote") {
        img.setAttribute("data-source-mode","remote");
        img.src=url(p.file);
      } else {
        var parent=img.closest(".tour-photo-open");
        if(parent)parent.style.display="none";
      }
    };
    img.src=local(pid);
  }
  function cardId(card) {
    var id=card.getAttribute("data-tour-id")||card.getAttribute("data-catalog25-card");
    if(id)return id;
    var b=card.querySelector("[data-fallback-detail],[data-catalog25-detail]");
    if(b)return b.getAttribute("data-fallback-detail")||b.getAttribute("data-catalog25-detail");
    var onclick=card.querySelector("[onclick*='openTour']");
    var found=onclick&&(onclick.getAttribute("onclick")||"").match(/openTour\(\s*['"]([^'"]+)['"]\s*\)/);
    return found?found[1]:null;
  }
  function applyCard(card) {
    var id=cardId(card),pid=tourPhoto[id],p=photos[pid];
    if(!id||!p||card.querySelector(".tour-photo-open"))return;
    var button=document.createElement("button");
    button.type="button";
    button.className="tour-photo-open";
    button.setAttribute("aria-label","Подробнее: "+(card.querySelector("h3")||{}).textContent);
    var img=document.createElement("img");
    setImage(img,pid);
    button.appendChild(img);
    var label=document.createElement("span");
    label.className="tour-photo-kicker";
    label.textContent=labels[pid]||"SamuRay Tours";
    button.appendChild(label);
    button.addEventListener("click",function(){
      var open=card.querySelector("[data-fallback-detail],[data-catalog25-detail]");
      if(open){open.click();return;}
      var any=card.querySelector("[onclick*='openTour']");
      if(any)any.click();
    });
    card.insertBefore(button,card.firstChild);
    card.setAttribute("data-photo-ready",pid);
  }
  function applyModal() {
    var root=document.getElementById("modalContent");
    if(!root)return;
    var poster=root.querySelector(".tour-detail-poster[data-tour-poster-id]");
    if(!poster)return;
    var id=poster.getAttribute("data-tour-poster-id");
    var pid=tourPhoto[id],photo=photos[pid];
    if(!photo)return;
    if(poster.getAttribute("data-photo-ready")===pid)return;
    var art=poster.querySelector(".tour-poster-artstage");
    if(!art)return;
    poster.setAttribute("data-photo-ready",pid);
    art.style.backgroundImage="linear-gradient(0deg,rgba(17,24,27,.15),rgba(17,24,27,0)),url('"+local(pid)+"')";
    var probe=new Image();
    probe.onerror=function(){
      art.style.backgroundImage="linear-gradient(0deg,rgba(17,24,27,.15),rgba(17,24,27,0)),url('"+url(photo.file)+"')";
    };
    probe.src=local(pid);
  }
  function addCredits() {
    var grid=document.getElementById("grid");
    if(!grid||document.getElementById("samuray-photo-credits"))return;
    var details=document.createElement("details");
    details.className="tour-photo-credits";
    details.id="samuray-photo-credits";
    var summary=document.createElement("summary");
    summary.textContent="Фотографии и авторы";
    details.appendChild(summary);
    var list=document.createElement("ul");
    Object.keys(photos).forEach(function(key){
      var p=photos[key],li=document.createElement("li");
      var a=document.createElement("a");
      a.href=sourcePage(p.file);
      a.textContent=p.file;
      a.target="_blank";
      a.rel="noopener noreferrer";
      li.appendChild(a);
      li.appendChild(document.createTextNode(" - "+p.credit+" · "));
      var license=document.createElement("a");
      license.href=p.license;
      license.textContent="лицензия";
      license.target="_blank";
      license.rel="noopener noreferrer";
      li.appendChild(license);
      list.appendChild(li);
    });
    details.appendChild(list);
    grid.parentElement.appendChild(details);
  }
  var scheduled=false;
  function render() {
    scheduled=false;
    var grid=document.getElementById("grid");
    if(grid){
      var cards=grid.querySelectorAll(".card");
      for(var i=0;i<cards.length;i++)applyCard(cards[i]);
    }
    applyModal();
    addCredits();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(render);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule);
  else schedule();
  var grid=document.getElementById("grid"),modal=document.getElementById("modalContent");
  if(grid)new MutationObserver(schedule).observe(grid,{childList:true,subtree:true});
  if(modal)new MutationObserver(schedule).observe(modal,{childList:true,subtree:true});
  window.addEventListener("load",schedule);
  window.SAMURAY_PHOTO_LAYER={version:"1.0",tourCount:Object.keys(tourPhoto).length,photoCount:Object.keys(photos).length};
})();